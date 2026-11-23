const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');

/**
 * @desc    Get all products with filtering, search, sorting & pagination
 * @route   GET /api/products
 * @access  Private (Admin & Staff)
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      lowStock,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 50,
      activeOnly,
    } = req.query;

    const query = {};

    // Filter by active status
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    // Filter by Category
    if (category) {
      query.category = category;
    }

    // Search by name, sku, or description
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { description: searchRegex },
      ];
    }

    // Filter low stock
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }

    // Sorting
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private (Admin & Staff)
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      description,
      category,
      price,
      costPrice,
      stock,
      lowStockThreshold,
      unit,
      imageUrl,
    } = req.body;

    if (!name || !sku || !category || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, SKU, category, price, and initial stock',
      });
    }

    // Check SKU uniqueness
    const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `A product with SKU '${sku.trim().toUpperCase()}' already exists`,
      });
    }

    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      description: description || '',
      category,
      price: Number(price),
      costPrice: costPrice !== undefined ? Number(costPrice) : 0,
      stock: Number(stock),
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
      unit: unit || 'pcs',
      imageUrl: imageUrl || '',
    });

    // Record initial inventory transaction if stock > 0
    if (Number(stock) > 0) {
      await InventoryTransaction.create({
        product: product._id,
        type: 'IN',
        reason: 'INITIAL_STOCK',
        quantity: Number(stock),
        previousStock: 0,
        newStock: Number(stock),
        performedBy: req.user._id,
        notes: 'Initial inventory setup on product creation',
      });
    }

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check SKU if updating
    if (req.body.sku && req.body.sku.trim().toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({
        sku: req.body.sku.trim().toUpperCase(),
        _id: { $ne: product._id },
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `SKU '${req.body.sku.trim().toUpperCase()}' is already taken by another product`,
        });
      }
      product.sku = req.body.sku.trim().toUpperCase();
    }

    if (req.body.name) product.name = req.body.name.trim();
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.category) product.category = req.body.category;
    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.costPrice !== undefined) product.costPrice = Number(req.body.costPrice);
    if (req.body.lowStockThreshold !== undefined)
      product.lowStockThreshold = Number(req.body.lowStockThreshold);
    if (req.body.unit) product.unit = req.body.unit;
    if (req.body.imageUrl !== undefined) product.imageUrl = req.body.imageUrl;
    if (req.body.isActive !== undefined) product.isActive = req.body.isActive;

    // Handle manual stock update if provided via product edit
    if (req.body.stock !== undefined && Number(req.body.stock) !== product.stock) {
      const newStock = Number(req.body.stock);
      const diff = newStock - product.stock;

      await InventoryTransaction.create({
        product: product._id,
        type: diff > 0 ? 'IN' : 'OUT',
        reason: 'CORRECTION',
        quantity: diff,
        previousStock: product.stock,
        newStock: newStock,
        performedBy: req.user._id,
        notes: 'Stock updated via product edit form',
      });

      product.stock = newStock;
    }

    const updatedProduct = await product.save();
    const populated = await Product.findById(updatedProduct._id).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Soft delete or hard delete based on requirements
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/products/low-stock
 * @access  Private (Admin & Staff)
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .populate('category', 'name')
      .sort({ stock: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};

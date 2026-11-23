const InventoryTransaction = require('../models/InventoryTransaction');
const Product = require('../models/Product');

/**
 * @desc    Get all inventory transactions with filtering & pagination
 * @route   GET /api/inventory/transactions
 * @access  Private (Admin & Staff)
 */
const getInventoryTransactions = async (req, res, next) => {
  try {
    const { product, type, reason, page = 1, limit = 50 } = req.query;

    const query = {};
    if (product) query.product = product;
    if (type) query.type = type;
    if (reason) query.reason = reason;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await InventoryTransaction.countDocuments(query);
    const transactions = await InventoryTransaction.find(query)
      .populate('product', 'name sku imageUrl unit')
      .populate('performedBy', 'name email role')
      .populate('referenceOrder', 'orderNumber orderStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Adjust product stock manually (Restock, Damage, Audit)
 * @route   POST /api/inventory/adjust
 * @access  Private/Admin
 */
const adjustStock = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason, notes } = req.body;

    if (!productId || !type || quantity === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, adjustment type, quantity, and reason',
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    if (type === 'IN') {
      newStock = previousStock + qty;
    } else if (type === 'OUT') {
      if (previousStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Cannot deduct ${qty} items. Only ${previousStock} items available in stock.`,
        });
      }
      newStock = previousStock - qty;
    } else if (type === 'ADJUSTMENT') {
      // Set absolute stock
      newStock = qty;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment type. Allowed types: IN, OUT, ADJUSTMENT',
      });
    }

    product.stock = newStock;
    await product.save();

    const transaction = await InventoryTransaction.create({
      product: product._id,
      type: type === 'ADJUSTMENT' ? (newStock >= previousStock ? 'IN' : 'OUT') : type,
      reason,
      quantity: type === 'IN' ? qty : type === 'OUT' ? -qty : newStock - previousStock,
      previousStock,
      newStock,
      performedBy: req.user._id,
      notes: notes || 'Manual stock adjustment',
    });

    const populatedTransaction = await InventoryTransaction.findById(transaction._id)
      .populate('product', 'name sku stock')
      .populate('performedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
        },
        transaction: populatedTransaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get summary of current inventory health
 * @route   GET /api/inventory/summary
 * @access  Private (Admin & Staff)
 */
const getInventorySummary = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true });

    let totalProducts = products.length;
    let totalStockItems = 0;
    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      totalStockItems += p.stock;
      totalInventoryValue += p.stock * p.price;
      if (p.stock === 0) {
        outOfStockCount++;
      } else if (p.stock <= p.lowStockThreshold) {
        lowStockCount++;
      }
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalStockItems,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryTransactions,
  adjustStock,
  getInventorySummary,
};

const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryTransaction = require('../models/InventoryTransaction');

/**
 * Generate formatted unique order number e.g. ORD-20261123-1001
 */
const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Order.countDocuments({
    orderNumber: new RegExp(`^ORD-${dateStr}`),
  });
  const sequence = String(countToday + 1).padStart(4, '0');
  return `ORD-${dateStr}-${sequence}`;
};

/**
 * @desc    Create new order with multi-item stock validation & deduction
 * @route   POST /api/orders
 * @access  Private (Admin & Staff)
 */
const createOrder = async (req, res, next) => {
  try {
    const {
      customerId,
      items,
      discount = 0,
      discountType = 'fixed',
      tax = 0,
      paymentMethod = 'Cash',
      notes = '',
    } = req.body;

    // Validation
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one product item',
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Step 1: Pre-validate stock availability for EVERY item before making changes
    const verifiedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with ID ${item.productId}`,
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product '${product.name}' is currently marked inactive and cannot be ordered`,
        });
      }

      const requestedQty = Number(item.quantity);
      if (isNaN(requestedQty) || requestedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product '${product.name}'`,
        });
      }

      if (product.stock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${requestedQty}`,
        });
      }

      const itemPrice = Number(item.price !== undefined ? item.price : product.price);
      const itemSubtotal = itemPrice * requestedQty;
      subtotal += itemSubtotal;

      verifiedItems.push({
        productDoc: product,
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: requestedQty,
        price: itemPrice,
        subtotal: itemSubtotal,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * Number(discount)) / 100;
    } else {
      discountAmount = Number(discount);
    }
    discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

    // Calculate tax
    const taxAmount = Number(tax) || 0;
    const finalTotal = Math.max(0, Math.round((subtotal - discountAmount + taxAmount) * 100) / 100);

    const orderNumber = await generateOrderNumber();

    // Step 2: Create Order record
    const order = await Order.create({
      orderNumber,
      customer: customer._id,
      items: verifiedItems.map((vi) => ({
        product: vi.productId,
        name: vi.name,
        sku: vi.sku,
        quantity: vi.quantity,
        price: vi.price,
        subtotal: vi.subtotal,
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      discount: discountAmount,
      discountType,
      tax: taxAmount,
      total: finalTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash' ? 'Paid' : 'Pending',
      orderStatus: 'Pending',
      stockRestored: false,
      createdBy: req.user._id,
      notes,
    });

    // Step 3: Deduct stock and log Inventory Transactions
    for (const item of verifiedItems) {
      const prevStock = item.productDoc.stock;
      const newStock = prevStock - item.quantity;

      item.productDoc.stock = newStock;
      await item.productDoc.save();

      await InventoryTransaction.create({
        product: item.productId,
        type: 'OUT',
        reason: 'ORDER_CREATED',
        quantity: -item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        referenceOrder: order._id,
        performedBy: req.user._id,
        notes: `Order created: ${orderNumber}`,
      });
    }

    // Step 4: Update customer statistics
    customer.totalOrders = (customer.totalOrders || 0) + 1;
    customer.totalSpent = (customer.totalSpent || 0) + finalTotal;
    await customer.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email phone address')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: `Order ${orderNumber} created successfully`,
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders with filtering & pagination
 * @route   GET /api/orders
 * @access  Private (Admin & Staff)
 */
const getOrders = async (req, res, next) => {
  try {
    const {
      status,
      search,
      customer,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // Filter by order status
    if (status) {
      query.orderStatus = status;
    }

    // Filter by customer
    if (customer) {
      query.customer = customer;
    }

    // Staff role restriction: if staff requests my-orders or only their orders
    if (req.user.role === 'staff' && req.query.myOrders === 'true') {
      query.createdBy = req.user._id;
    }

    // Search by orderNumber
    if (search && search.trim() !== '') {
      query.orderNumber = new RegExp(search.trim(), 'i');
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email role')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private (Admin & Staff)
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name sku imageUrl price stock')
      .populate('createdBy', 'name email role');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status with exact-once stock restoration on cancellation
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin & Staff)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, notes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed: ${allowedStatuses.join(', ')}`,
      });
    }

    // Restrict staff from modifying cancelled orders
    if (previousStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled orders cannot be altered or reactivated.',
      });
    }

    // CRITICAL: Handle Order Cancellation and exact-once stock restoration
    if (status === 'Cancelled' && previousStatus !== 'Cancelled' && !order.stockRestored) {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const prevStock = product.stock;
          const newStock = prevStock + item.quantity;
          product.stock = newStock;
          await product.save();

          await InventoryTransaction.create({
            product: product._id,
            type: 'IN',
            reason: 'ORDER_CANCELLED',
            quantity: item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            referenceOrder: order._id,
            performedBy: req.user._id,
            notes: `Stock restored from cancelled order ${order.orderNumber}`,
          });
        }
      }

      // Mark stock as restored to prevent double restoration
      order.stockRestored = true;

      // Adjust customer totalSpent
      const customer = await Customer.findById(order.customer);
      if (customer) {
        customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - order.total);
        await customer.save();
      }
    }

    if (status) order.orderStatus = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (notes) order.notes = notes;

    const updatedOrder = await order.save();
    const populated = await Order.findById(updatedOrder._id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name email role');

    res.json({
      success: true,
      message: `Order status updated to '${status || order.orderStatus}'`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};

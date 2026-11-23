const Customer = require('../models/Customer');
const Order = require('../models/Order');

/**
 * @desc    Get all customers with search & pagination
 * @route   GET /api/customers
 * @access  Private (Admin & Staff)
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: customers.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 * @access  Private (Admin & Staff)
 */
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch customer's orders
    const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...customer.toObject(),
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Private (Admin & Staff)
 */
const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required',
      });
    }

    // Optional phone uniqueness check
    const existingPhone = await Customer.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'A customer with this phone number already exists',
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : '',
      phone: phone.trim(),
      address: address || {},
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private (Admin & Staff)
 */
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (req.body.name) customer.name = req.body.name.trim();
    if (req.body.email !== undefined) customer.email = req.body.email.trim().toLowerCase();
    if (req.body.phone) {
      const existing = await Customer.findOne({
        phone: req.body.phone.trim(),
        _id: { $ne: customer._id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another customer with this phone number already exists',
        });
      }
      customer.phone = req.body.phone.trim();
    }
    if (req.body.address) customer.address = req.body.address;
    if (req.body.notes !== undefined) customer.notes = req.body.notes;

    const updatedCustomer = await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private/Admin
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orderCount = await Order.countDocuments({ customer: customer._id });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer. They have ${orderCount} existing order records.`,
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer purchase history
 * @route   GET /api/customers/:id/orders
 * @access  Private (Admin & Staff)
 */
const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.params.id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
};

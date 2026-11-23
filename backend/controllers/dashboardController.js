const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

/**
 * @desc    Get main dashboard statistics (All calculated dynamically from MongoDB)
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin & Staff)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total counts
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalCustomers = await Customer.countDocuments();
    const totalOrders = await Order.countDocuments();

    // 2. Total Sales Revenue (Excluding Cancelled orders)
    const revenueResult = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? Math.round(revenueResult[0].totalRevenue * 100) / 100 : 0;

    // 3. Low stock and Out of stock counts
    const lowStockCount = await Product.countDocuments({
      isActive: true,
      $expr: {
        $and: [
          { $lte: ['$stock', '$lowStockThreshold'] },
          { $gt: ['$stock', 0] },
        ],
      },
    });

    const outOfStockCount = await Product.countDocuments({
      isActive: true,
      stock: 0,
    });

    // 4. Inventory Valuation
    const valuationResult = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
        },
      },
    ]);

    const totalStock = valuationResult.length > 0 ? valuationResult[0].totalStock : 0;
    const inventoryValue = valuationResult.length > 0 ? Math.round(valuationResult[0].totalValue * 100) / 100 : 0;

    // 5. Orders by Status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    const statusCounts = {
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    ordersByStatus.forEach((item) => {
      if (item._id && statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalRevenue,
        lowStockCount,
        outOfStockCount,
        totalStock,
        inventoryValue,
        statusCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sales analytics chart data (last 7 or 30 days)
 * @route   GET /api/dashboard/sales
 * @access  Private (Admin & Staff)
 */
const getSalesAnalytics = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // Sales grouped by day
    const dailyData = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'Cancelled' },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates with zero
    const dateMap = {};
    dailyData.forEach((d) => {
      dateMap[d._id] = { revenue: Math.round(d.revenue * 100) / 100, orders: d.orders };
    });

    const formattedTrend = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      formattedTrend.push({
        date: key,
        label: displayDate,
        revenue: dateMap[key] ? dateMap[key].revenue : 0,
        orders: dateMap[key] ? dateMap[key].orders : 0,
      });
    }

    // Sales by Category
    const categorySales = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: '$categoryDetails.name',
          totalSales: { $sum: '$items.subtotal' },
          unitsSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      data: {
        trend: formattedTrend,
        categorySales: categorySales.map((c) => ({
          name: c._id,
          value: Math.round(c.totalSales * 100) / 100,
          units: c.unitsSold,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent orders for dashboard table
 * @route   GET /api/dashboard/recent-orders
 * @access  Private (Admin & Staff)
 */
const getRecentOrders = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    const orders = await Order.find({})
      .populate('customer', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

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
  getDashboardStats,
  getSalesAnalytics,
  getRecentOrders,
};

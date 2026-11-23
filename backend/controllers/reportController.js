const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * @desc    Get daily sales report
 * @route   GET /api/reports/daily
 * @access  Private/Admin
 */
const getDailySalesReport = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const report = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'Cancelled' },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      success: true,
      count: report.length,
      data: report.map((r) => ({
        date: r._id,
        revenue: Math.round(r.totalRevenue * 100) / 100,
        orders: r.totalOrders,
        avgOrderValue: Math.round(r.avgOrderValue * 100) / 100,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly sales report
 * @route   GET /api/reports/monthly
 * @access  Private/Admin
 */
const getMonthlySalesReport = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const report = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'Cancelled' },
          createdAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const formatted = report.map((r) => {
      const [year, monthNum] = r._id.split('-');
      const monthName = months[parseInt(monthNum, 10) - 1];
      return {
        month: `${monthName} ${year}`,
        monthKey: r._id,
        revenue: Math.round(r.totalRevenue * 100) / 100,
        orders: r.totalOrders,
        avgOrderValue: Math.round(r.avgOrderValue * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get best-selling / top products
 * @route   GET /api/reports/top-products
 * @access  Private (Admin & Staff)
 */
const getTopProductsReport = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const topProducts = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'currentProduct',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          totalUnitsSold: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1,
          currentStock: { $arrayElemAt: ['$currentProduct.stock', 0] },
          price: { $arrayElemAt: ['$currentProduct.price', 0] },
          imageUrl: { $arrayElemAt: ['$currentProduct.imageUrl', 0] },
        },
      },
    ]);

    res.json({
      success: true,
      count: topProducts.length,
      data: topProducts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed inventory valuation & breakdown
 * @route   GET /api/reports/inventory-valuation
 * @access  Private/Admin
 */
const getInventoryValuationReport = async (req, res, next) => {
  try {
    const categories = await Category.find({});

    const categoryBreakdown = await Promise.all(
      categories.map(async (cat) => {
        const result = await Product.aggregate([
          { $match: { category: cat._id, isActive: true } },
          {
            $group: {
              _id: null,
              productCount: { $sum: 1 },
              totalStock: { $sum: '$stock' },
              retailValue: { $sum: { $multiply: ['$stock', '$price'] } },
              costValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
            },
          },
        ]);

        const data = result[0] || {
          productCount: 0,
          totalStock: 0,
          retailValue: 0,
          costValue: 0,
        };

        return {
          categoryId: cat._id,
          categoryName: cat.name,
          productCount: data.productCount,
          totalStock: data.totalStock,
          retailValue: Math.round(data.retailValue * 100) / 100,
          costValue: Math.round(data.costValue * 100) / 100,
          potentialProfit: Math.round((data.retailValue - data.costValue) * 100) / 100,
        };
      })
    );

    const overall = categoryBreakdown.reduce(
      (acc, curr) => ({
        totalProducts: acc.totalProducts + curr.productCount,
        totalStock: acc.totalStock + curr.totalStock,
        totalRetailValue: acc.totalRetailValue + curr.retailValue,
        totalCostValue: acc.totalCostValue + curr.costValue,
        totalPotentialProfit: acc.totalPotentialProfit + curr.potentialProfit,
      }),
      {
        totalProducts: 0,
        totalStock: 0,
        totalRetailValue: 0,
        totalCostValue: 0,
        totalPotentialProfit: 0,
      }
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts: overall.totalProducts,
          totalStock: overall.totalStock,
          totalRetailValue: Math.round(overall.totalRetailValue * 100) / 100,
          totalCostValue: Math.round(overall.totalCostValue * 100) / 100,
          totalPotentialProfit: Math.round(overall.totalPotentialProfit * 100) / 100,
        },
        byCategory: categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailySalesReport,
  getMonthlySalesReport,
  getTopProductsReport,
  getInventoryValuationReport,
};

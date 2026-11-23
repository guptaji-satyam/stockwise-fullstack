const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesAnalytics,
  getRecentOrders,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/sales', getSalesAnalytics);
router.get('/recent-orders', getRecentOrders);

module.exports = router;

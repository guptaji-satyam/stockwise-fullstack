const express = require('express');
const router = express.Router();
const {
  getDailySalesReport,
  getMonthlySalesReport,
  getTopProductsReport,
  getInventoryValuationReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/daily', authorize('admin'), getDailySalesReport);
router.get('/monthly', authorize('admin'), getMonthlySalesReport);
router.get('/top-products', getTopProductsReport);
router.get('/inventory-valuation', authorize('admin'), getInventoryValuationReport);

module.exports = router;

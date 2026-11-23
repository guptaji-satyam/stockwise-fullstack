const express = require('express');
const router = express.Router();
const {
  getInventoryTransactions,
  adjustStock,
  getInventorySummary,
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/transactions', getInventoryTransactions);
router.get('/summary', getInventorySummary);
router.post('/adjust', authorize('admin'), adjustStock);

module.exports = router;

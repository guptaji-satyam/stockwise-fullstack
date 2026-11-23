const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Transaction must reference a product'],
    },
    type: {
      type: String,
      enum: {
        values: ['IN', 'OUT', 'ADJUSTMENT'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'INITIAL_STOCK',
        'ORDER_CREATED',
        'ORDER_CANCELLED',
        'MANUAL_RESTOCK',
        'DAMAGE_WASTE',
        'INVENTORY_AUDIT',
        'CORRECTION',
      ],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    notes: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ type: 1 });
inventoryTransactionSchema.index({ reason: 1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

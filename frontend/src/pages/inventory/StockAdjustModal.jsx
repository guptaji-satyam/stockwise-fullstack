import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Loader2, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export const StockAdjustModal = ({
  isOpen,
  onClose,
  onSubmit,
  products = [],
  selectedProduct = null,
  isLoading = false,
}) => {
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('MANUAL_RESTOCK');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedProduct) {
      setProductId(selectedProduct._id);
    } else if (products.length > 0 && !productId) {
      setProductId(products[0]._id);
    }
    setQuantity('');
    setType('IN');
    setReason('MANUAL_RESTOCK');
    setNotes('');
    setError('');
  }, [selectedProduct, products, isOpen]);

  const currentProduct = products.find((p) => p._id === productId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId) {
      setError('Please select a product');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    if (type === 'OUT' && currentProduct && currentProduct.stock < qty) {
      setError(`Cannot deduct ${qty}. Only ${currentProduct.stock} available.`);
      return;
    }

    onSubmit({
      productId,
      type,
      quantity: qty,
      reason,
      notes: notes.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Inventory Stock"
      subtitle="Manually restock or write off inventory items"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Product *
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={!!selectedProduct}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75"
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku}) — Current Stock: {p.stock} {p.unit}
              </option>
            ))}
          </select>
          {currentProduct && (
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Current Available: <span className="font-bold text-slate-900">{currentProduct.stock} {currentProduct.unit}</span>
            </p>
          )}
        </div>

        {/* Adjustment Type Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Adjustment Type *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('IN');
                setReason('MANUAL_RESTOCK');
              }}
              className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                type === 'IN'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5 text-emerald-600" />
              Restock (IN)
            </button>

            <button
              type="button"
              onClick={() => {
                setType('OUT');
                setReason('DAMAGE_WASTE');
              }}
              className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                type === 'OUT'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 mr-1.5 text-rose-600" />
              Deduct / Damage (OUT)
            </button>
          </div>
        </div>

        {/* Quantity & Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to {type === 'IN' ? 'Add' : 'Deduct'} *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              placeholder="e.g. 10"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {type === 'IN' ? (
                <>
                  <option value="MANUAL_RESTOCK">Manual Restock / Delivery</option>
                  <option value="INVENTORY_AUDIT">Inventory Audit Gain</option>
                  <option value="CORRECTION">Correction</option>
                </>
              ) : (
                <>
                  <option value="DAMAGE_WASTE">Damage / Spoilage</option>
                  <option value="INVENTORY_AUDIT">Inventory Audit Shrinkage</option>
                  <option value="CORRECTION">Correction</option>
                </>
              )}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Audit Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Vendor delivery invoice #1042"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-60"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Adjustment
          </button>
        </div>
      </form>
    </Modal>
  );
};

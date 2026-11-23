import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Loader2 } from 'lucide-react';

export const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  product = null,
  categories = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    lowStockThreshold: '5',
    unit: 'pcs',
    imageUrl: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: product.category?._id || product.category || '',
        price: product.price !== undefined ? String(product.price) : '',
        costPrice: product.costPrice !== undefined ? String(product.costPrice) : '0',
        stock: product.stock !== undefined ? String(product.stock) : '0',
        lowStockThreshold: product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : '5',
        unit: product.unit || 'pcs',
        imageUrl: product.imageUrl || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        description: '',
        category: categories.length > 0 ? categories[0]._id : '',
        price: '',
        costPrice: '0',
        stock: '0',
        lowStockThreshold: '5',
        unit: 'pcs',
        imageUrl: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [product, categories, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU is required';
    if (!formData.category) errs.category = 'Please select a category';
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errs.price = 'Valid selling price is required';
    }
    if (formData.stock === '' || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      errs.stock = 'Valid stock quantity is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      price: Number(formData.price),
      costPrice: Number(formData.costPrice || 0),
      stock: Number(formData.stock),
      lowStockThreshold: Number(formData.lowStockThreshold || 5),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      subtitle={product ? `Update details for SKU: ${product.sku}` : 'Create a new inventory catalog item'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Optical Mouse"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unique SKU Code *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              placeholder="e.g. ELEC-MOU-001"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.sku ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {errors.sku && <p className="text-xs text-rose-500 mt-1">{errors.sku}</p>}
          </div>
        </div>

        {/* Category & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
              }`}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Measurement Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
              <option value="bundle">Bundle</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="meter">Meters (m)</option>
            </select>
          </div>
        </div>

        {/* Price, Cost Price, Stock & Low Threshold */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selling Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.price ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            {errors.price && <p className="text-[11px] text-rose-500 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cost Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Stock *
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="0"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.stock ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            {errors.stock && <p className="text-[11px] text-rose-500 mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Low Alert Qty
            </label>
            <input
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              placeholder="5"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Image URL & Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Image URL (Optional)
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Product Description
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Key features, specifications, and notes..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Modal Actions */}
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
            {product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  CreditCard,
  Percent,
  CheckCircle,
  AlertCircle,
  Package,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { orderService } from '../../services/orderService';
import { CustomerModal } from '../customers/CustomerModal';
import { useToast } from '../../hooks/useToast';

export const CreateOrder = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Order state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState('fixed');
  const [tax, setTax] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  // Product catalog search
  const [productSearch, setProductSearch] = useState('');

  // Quick Customer Create Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalLoading, setCustomerModalLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, custRes] = await Promise.all([
        productService.getProducts({ activeOnly: 'true', limit: 100 }),
        customerService.getCustomers({ limit: 100 }),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (custRes.success) {
        setCustomers(custRes.data);
        if (custRes.data.length > 0) {
          setSelectedCustomerId(custRes.data[0]._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load catalog or customer lists');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error(`'${product.name}' is currently out of stock`);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Cannot exceed available stock (${product.stock} ${product.unit})`);
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            name: product.name,
            sku: product.sku,
            price: product.price,
            quantity: 1,
            subtotal: product.price,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId, newQty) => {
    const item = cartItems.find((i) => i.product._id === productId);
    if (!item) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.product.stock) {
      toast.warning(`Maximum available stock is ${item.product.stock}`);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.product._id === productId
          ? { ...i, quantity: newQty, subtotal: newQty * i.price }
          : i
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((i) => i.product._id !== productId));
  };

  // Quick Customer Creation
  const handleQuickCustomerSave = async (formData) => {
    try {
      setCustomerModalLoading(true);
      const res = await customerService.createCustomer(formData);
      if (res.success && res.data) {
        toast.success(`Customer ${res.data.name} added`);
        setCustomers((prev) => [res.data, ...prev]);
        setSelectedCustomerId(res.data._id);
        setIsCustomerModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setCustomerModalLoading(false);
    }
  };

  // Price calculations
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * Number(discount || 0)) / 100;
  } else {
    discountAmount = Number(discount || 0);
  }
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  const taxAmount = Number(tax || 0);
  const grandTotal = Math.max(0, Math.round((subtotal - discountAmount + taxAmount) * 100) / 100);

  // Submit Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error('Please select or create a customer for this order');
      return;
    }

    if (cartItems.length === 0) {
      toast.warning('Cart is empty. Please add products to create an order');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: selectedCustomerId,
        items: cartItems.map((item) => ({
          productId: item.product._id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
        })),
        discount: Number(discount || 0),
        discountType,
        tax: Number(tax || 0),
        paymentMethod,
        notes,
      };

      const res = await orderService.createOrder(payload);
      if (res.success) {
        toast.success(`Order ${res.data.orderNumber} created successfully! Stock updated.`);
        navigate('/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const formatCurrency = (val) => `$${Number(val || 0).toFixed(2)}`;

  if (loading) {
    return <LoadingSpinner text="Setting up checkout terminal..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Customer Order
            </h1>
            <p className="text-xs text-slate-500">
              POS point-of-sale checkout with real-time stock deduction.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Catalog Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name or SKU to add to cart..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Available Catalog ({filteredProducts.length} items)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const inCart = cartItems.find((i) => i.product._id === p._id);
                const isOutOfStock = p.stock <= 0;

                return (
                  <div
                    key={p._id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : inCart
                        ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-400/30'
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs block leading-tight">
                          {p.name}
                        </span>
                        <span className="text-xs font-extrabold text-blue-600 flex-shrink-0">
                          {formatCurrency(p.price)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {p.sku}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span
                        className={`font-semibold ${
                          isOutOfStock ? 'text-rose-600' : p.stock <= p.lowStockThreshold ? 'text-amber-600' : 'text-slate-500'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : `${p.stock} ${p.unit} left`}
                      </span>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : inCart
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                        } transition`}
                      >
                        {inCart ? `Added (${inCart.quantity})` : '+ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleCreateOrder} className="space-y-4">
            {/* Customer Selection Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Customer *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5" />
                  New Customer
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Shopping Cart Items List */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Order Items ({cartItems.length})
                </span>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Your order cart is empty. Select items from the catalog.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.product._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatCurrency(item.price)} × {item.quantity} ={' '}
                          <span className="font-bold text-slate-800">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product._id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations & Payment */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              {/* Discount & Tax inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Discount
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200">
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 text-xs focus:outline-none"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="bg-slate-100 px-1.5 text-[11px] font-bold text-slate-600 border-l border-slate-200"
                    >
                      <option value="fixed">$</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tax Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="Cash">Cash (Immediate Receipt)</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="Credit Card">Credit / Debit Card</option>
                  <option value="UPI">UPI / Digital Wallet</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                </select>
              </div>

              {/* Order Notes */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Order notes / delivery remarks..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Summary Totals */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax:</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Order & Stock...
                  </>
                ) : (
                  `Complete Order (${formatCurrency(grandTotal)})`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Customer Creation Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleQuickCustomerSave}
        isLoading={customerModalLoading}
      />
    </div>
  );
};

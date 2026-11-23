import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { StockAdjustModal } from './StockAdjustModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const InventoryList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'levels';

  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transaction pagination
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txTotalCount, setTxTotalCount] = useState(0);

  // Search & Filters
  const [search, setSearch] = useState('');

  // Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, sumRes] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        inventoryService.getSummary(),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (sumRes.success) setSummary(sumRes.data);

      if (currentTab === 'history') {
        const txRes = await inventoryService.getTransactions({ page: txPage, limit: 15 });
        if (txRes.success) {
          setTransactions(txRes.data);
          setTxTotalPages(txRes.totalPages || 1);
          setTxTotalCount(txRes.total || 0);
        }
      }
    } catch (err) {
      toast.error('Failed to load inventory data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTab, txPage]);

  const handleOpenAdjust = (prod = null) => {
    setTargetProduct(prod);
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (adjustmentData) => {
    try {
      setActionLoading(true);
      await inventoryService.adjustStock(adjustmentData);
      toast.success('Stock level adjusted and transaction logged');
      setIsAdjustOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered lists
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts = filteredProducts.filter((p) => p.stock <= p.lowStockThreshold);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock tracking, threshold warnings, and verifiable movement logs.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => handleOpenAdjust(null)}
            className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Adjust Inventory Stock
          </button>
        )}
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Units</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{summary?.totalStockItems || 0} pcs</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Valuation</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            ${summary?.totalInventoryValue ? Number(summary.totalInventoryValue).toFixed(2) : '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Low Stock Alert</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{summary?.lowStockCount || 0} items</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Out of Stock</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{summary?.outOfStockCount || 0} items</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setSearchParams({ tab: 'levels' })}
          className={`pb-3 relative transition ${
            currentTab === 'levels'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Stock Levels
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'low-stock' })}
          className={`pb-3 relative transition flex items-center space-x-1.5 ${
            currentTab === 'low-stock'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Low-Stock Alerts</span>
          {summary?.lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {summary.lowStockCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'history' })}
          className={`pb-3 relative transition ${
            currentTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Audit History Logs
        </button>
      </div>

      {/* Tab 1: All Stock Levels */}
      {currentTab === 'levels' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by product name or SKU..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">In Stock</th>
                  <th className="px-5 py-3">Threshold</th>
                  <th className="px-5 py-3">Status</th>
                  {isAdmin && <th className="px-5 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold && p.stock > 0;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{p.sku}</td>
                      <td className="px-5 py-3.5 font-bold">
                        {p.stock} {p.unit}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {p.lowStockThreshold} {p.unit}
                      </td>
                      <td className="px-5 py-3.5">
                        {isOut ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Low-Stock Alerts */}
      {currentTab === 'low-stock' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Urgent Restock Required</h3>
            <p className="text-xs text-slate-500">
              Items at or below designated safety thresholds requiring re-order.
            </p>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Inventory Health Excellent</h4>
              <p className="text-xs text-slate-500">No items are currently below low-stock threshold.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((p) => (
                <div key={p._id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                      <p className="text-xs text-slate-500">
                        SKU: <span className="font-mono">{p.sku}</span> | Category: {p.category?.name || 'General'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="block text-sm font-black text-rose-600">{p.stock} {p.unit} remaining</span>
                      <span className="block text-[11px] text-slate-400">Min Threshold: {p.lowStockThreshold} {p.unit}</span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenAdjust(p)}
                        className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition"
                      >
                        Restock Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Audit Transaction History */}
      {currentTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Inventory Movement Audit Log</h3>
            <p className="text-xs text-slate-500">
              Immutable ledger of all inbound, outbound, and manual stock changes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Prev → New</th>
                  <th className="px-5 py-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => {
                  const isIn = tx.type === 'IN';
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {tx.product?.name || 'Deleted Product'}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          {tx.product?.sku}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isIn ? (
                            <ArrowUpRight className="w-3 h-3 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 mr-0.5" />
                          )}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        {tx.reason.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold">
                        <span className={isIn ? 'text-emerald-600' : 'text-rose-600'}>
                          {isIn ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">
                        {tx.previousStock} → <span className="font-bold text-slate-900">{tx.newStock}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {tx.performedBy?.name || 'System Auto'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={txPage}
            totalPages={txTotalPages}
            onPageChange={(page) => setTxPage(page)}
            totalItems={txTotalCount}
            itemsPerPage={15}
          />
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onSubmit={handleAdjustSubmit}
        products={products}
        selectedProduct={targetProduct}
        isLoading={actionLoading}
      />
    </div>
  );
};

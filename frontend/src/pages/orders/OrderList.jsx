import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { OrderDetailModal } from './OrderDetailModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrders({
        search,
        status: statusFilter,
        page: currentPage,
        limit: 10,
      });

      if (res.success) {
        setOrders(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load orders list');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, currentPage]);

  const handleOpenDetail = async (orderId) => {
    try {
      const res = await orderService.getOrderById(orderId);
      if (res.success) {
        setSelectedOrder(res.data);
        setIsDetailOpen(true);
      }
    } catch (err) {
      toast.error('Could not fetch order invoice details');
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === 'Cancelled') {
      setOrderToCancel(order);
      setIsCancelConfirmOpen(true);
      return;
    }

    try {
      const res = await orderService.updateOrderStatus(order._id, { status: newStatus });
      if (res.success) {
        toast.success(`Order ${order.orderNumber} status changed to ${newStatus}`);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      setActionLoading(true);
      const res = await orderService.updateOrderStatus(orderToCancel._id, {
        status: 'Cancelled',
      });
      if (res.success) {
        toast.success(`Order ${orderToCancel.orderNumber} cancelled. Reserved stock was safely restored!`);
        setIsCancelConfirmOpen(false);
        setOrderToCancel(null);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `$${Number(val || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales & Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fulfill orders, track shipping status, and audit customer invoices.
          </p>
        </div>

        <Link
          to="/orders/new"
          className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Order
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by order number (e.g. ORD-202611...)"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="No customer sales orders have been logged yet or matched your query."
            action={
              <Link
                to="/orders/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Create First Order
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Order #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Update Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((ord) => {
                  const isCancelled = ord.orderStatus === 'Cancelled';
                  return (
                    <tr key={ord._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {ord.customer?.name || 'Walk-in'}
                        <span className="block text-[11px] text-slate-400">
                          {ord.customer?.phone}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {ord.items?.length || 0} line item{ord.items?.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatCurrency(ord.total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <PaymentStatusBadge status={ord.paymentStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        <OrderStatusBadge status={ord.orderStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={ord.orderStatus}
                          disabled={isCancelled}
                          onChange={(e) => handleStatusChange(ord, e.target.value)}
                          className={`px-2 py-1 rounded-lg border text-xs font-semibold focus:outline-none transition ${
                            isCancelled
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled (Restore Stock)</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenDetail(ord._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={totalCount}
          itemsPerPage={10}
        />
      </div>

      {/* Invoice Details Modal */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
      />

      {/* Cancel Order Safety Confirmation Modal */}
      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Order & Restore Stock"
        message={`Are you sure you want to cancel order '${orderToCancel?.orderNumber}'? The ordered items (${orderToCancel?.items?.length || 0} products) will be automatically returned to the inventory catalog, and an audit transaction will be recorded.`}
        confirmText="Confirm Cancellation"
        isLoading={actionLoading}
      />
    </div>
  );
};

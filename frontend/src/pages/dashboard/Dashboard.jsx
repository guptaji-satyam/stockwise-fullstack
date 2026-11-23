import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Boxes,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Eye,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { OrderStatusBadge } from '../../components/common/Badge';
import { SalesAreaChart } from '../../components/charts/SalesAreaChart';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState({ trend: [], categorySales: [] });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesDays, setSalesDays] = useState(7);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsRes, salesRes, ordersRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getSalesAnalytics(salesDays),
        dashboardService.getRecentOrders(6),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (salesRes.success) setSalesData(salesRes.data);
      if (ordersRes.success) setRecentOrders(ordersRes.data);

      if (isManualRefresh) {
        toast.success('Dashboard metrics refreshed');
      }
    } catch (error) {
      toast.error('Failed to load dashboard metrics');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [salesDays]);

  if (loading) {
    return <LoadingSpinner text="Compiling dashboard analytics..." fullScreen />;
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time overview of products, stock levels, sales revenue, and recent customer orders.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>
          <Link
            to="/orders/new"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Create New Order
          </Link>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue)}
          icon={DollarSign}
          color="emerald"
          subtitle="Net sales from fulfilled & pending orders"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="blue"
          subtitle={`${stats?.statusCounts?.Pending || 0} pending processing`}
        />
        <StatCard
          title="Active Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="indigo"
          subtitle={`${stats?.totalStock || 0} total units in catalog`}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.lowStockCount || 0}
          icon={AlertTriangle}
          color={stats?.lowStockCount > 0 ? 'rose' : 'emerald'}
          subtitle={
            stats?.outOfStockCount > 0
              ? `${stats.outOfStockCount} items completely out of stock`
              : 'All threshold levels safe'
          }
        />
      </div>

      {/* Low Stock Warning Banner if applicable */}
      {stats?.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {stats.lowStockCount} product{stats.lowStockCount > 1 ? 's' : ''} running low on inventory
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Restock needed to prevent order fulfillment delays.
              </p>
            </div>
          </div>
          <Link
            to="/inventory?tab=low-stock"
            className="inline-flex items-center text-xs font-bold text-amber-900 hover:text-amber-950 underline flex-shrink-0"
          >
            Review Low Stock Items
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Line/Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Performance</h3>
              <p className="text-xs text-slate-500">Sales volume over the selected time window</p>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSalesDays(7)}
                className={`px-3 py-1 rounded-lg transition ${
                  salesDays === 7 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setSalesDays(30)}
                className={`px-3 py-1 rounded-lg transition ${
                  salesDays === 30 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>
          <SalesAreaChart data={salesData.trend} />
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Sales by Category</h3>
            <p className="text-xs text-slate-500">Distribution of revenue across product types</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <CategoryPieChart data={salesData.categorySales} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders & Inventory Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-500">Latest transactions logged across sales channels</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
            >
              View All Orders
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                      No customer orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {order.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {order.items?.length || 0} item{order.items?.length > 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <OrderStatusBadge status={order.orderStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations & Inventory Valuation Box */}
        <div className="space-y-6">
          {/* Inventory Valuation Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Catalog Valuation
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-1">
              {formatCurrency(stats?.inventoryValue)}
            </div>
            <p className="text-xs text-slate-400">
              Total retail inventory value across {stats?.totalProducts || 0} active products.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Units in Stock:</span>
              <span className="font-bold text-white">{stats?.totalStock || 0} pcs</span>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Quick Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/orders/new"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-100 transition group"
              >
                <ShoppingCart className="w-5 h-5 mb-1.5 text-slate-500 group-hover:text-blue-600" />
                <span className="text-xs font-semibold text-center">New Order</span>
              </Link>
              <Link
                to="/products"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-100 transition group"
              >
                <Package className="w-5 h-5 mb-1.5 text-slate-500 group-hover:text-blue-600" />
                <span className="text-xs font-semibold text-center">Products</span>
              </Link>
              <Link
                to="/inventory"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-100 transition group"
              >
                <Boxes className="w-5 h-5 mb-1.5 text-slate-500 group-hover:text-blue-600" />
                <span className="text-xs font-semibold text-center">Adjust Stock</span>
              </Link>
              <Link
                to="/customers"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-100 transition group"
              >
                <Users className="w-5 h-5 mb-1.5 text-slate-500 group-hover:text-blue-600" />
                <span className="text-xs font-semibold text-center">Customers</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

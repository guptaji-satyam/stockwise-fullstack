import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Download,
  Calendar,
  Award,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { SalesAreaChart } from '../../components/charts/SalesAreaChart';
import { TopProductsBarChart } from '../../components/charts/TopProductsBarChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatCard } from '../../components/common/StatCard';
import { useToast } from '../../hooks/useToast';

export const ReportsPage = () => {
  const [dailySales, setDailySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const toast = useToast();

  const loadReports = async () => {
    try {
      setLoading(true);
      const [dailyRes, monthlyRes, topRes, valRes] = await Promise.all([
        reportService.getDailySales(days),
        reportService.getMonthlySales(),
        reportService.getTopProducts(10),
        reportService.getInventoryValuation(),
      ]);

      if (dailyRes.success) setDailySales(dailyRes.data);
      if (monthlyRes.success) setMonthlySales(monthlyRes.data);
      if (topRes.success) setTopProducts(topRes.data);
      if (valRes.success) setValuation(valRes.data);
    } catch (err) {
      toast.error('Failed to generate sales reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [days]);

  const formatCurrency = (val) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportCSV = () => {
    if (dailySales.length === 0) {
      toast.warning('No report data to export');
      return;
    }

    const headers = 'Date,Revenue,Orders,Average Order Value\n';
    const rows = dailySales
      .map((d) => `${d.date},${d.revenue},${d.orders},${d.avgOrderValue}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StockWise_Daily_Sales_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  if (loading) {
    return <LoadingSpinner text="Crunching sales analytics and valuation..." fullScreen />;
  }

  // Chart data formatting
  const formattedDailyTrend = dailySales.map((d) => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders,
  })).reverse();

  const totalPeriodRevenue = dailySales.reduce((sum, d) => sum + d.revenue, 0);
  const totalPeriodOrders = dailySales.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Executive Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial revenue trends, catalog valuation margins, and bestseller rankings.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>

          <button
            onClick={exportCSV}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Period Sales Revenue"
          value={formatCurrency(totalPeriodRevenue)}
          icon={DollarSign}
          color="emerald"
          subtitle={`Across last ${days} days`}
        />
        <StatCard
          title="Total Orders Count"
          value={totalPeriodOrders}
          icon={BarChart3}
          color="blue"
          subtitle={`Average: ${days > 0 ? (totalPeriodOrders / days).toFixed(1) : 0} orders/day`}
        />
        <StatCard
          title="Total Retail Valuation"
          value={formatCurrency(valuation?.summary?.totalRetailValue)}
          icon={Package}
          color="indigo"
          subtitle={`Cost Basis: ${formatCurrency(valuation?.summary?.totalCostValue)}`}
        />
        <StatCard
          title="Projected Profit Margin"
          value={formatCurrency(valuation?.summary?.totalPotentialProfit)}
          icon={TrendingUp}
          color="amber"
          subtitle="Net markup across current stock"
        />
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Revenue Velocity Chart</h3>
            <p className="text-xs text-slate-500">Daily gross revenue across all sales</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            Daily Trend
          </span>
        </div>
        <SalesAreaChart data={formattedDailyTrend} />
      </div>

      {/* Top Products & Category Valuation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Award className="w-4 h-4 mr-1.5 text-amber-500" />
                Best-Selling Products
              </h3>
              <p className="text-xs text-slate-500">Ranked by overall units sold</p>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            <TopProductsBarChart data={topProducts} />

            <div className="mt-4 pt-3 border-t border-slate-100 divide-y divide-slate-100">
              {topProducts.slice(0, 4).map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{p.totalUnitsSold} units</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{formatCurrency(p.totalRevenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Valuation by Category */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-blue-600" />
              Category Valuation & Margins
            </h3>
            <p className="text-xs text-slate-500">Stock cost vs retail sale projections</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock Units</th>
                  <th className="px-4 py-3">Retail Value</th>
                  <th className="px-4 py-3">Cost Basis</th>
                  <th className="px-4 py-3 text-right">Potential Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {valuation?.byCategory?.map((cat) => (
                  <tr key={cat.categoryId} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">{cat.categoryName}</td>
                    <td className="px-4 py-3">{cat.totalStock} pcs</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(cat.retailValue)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatCurrency(cat.costValue)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      +{formatCurrency(cat.potentialProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

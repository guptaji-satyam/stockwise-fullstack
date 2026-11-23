import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const TopProductsBarChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No sales data available
      </div>
    );
  }

  // Take top 5
  const chartData = data.slice(0, 5).map((d) => ({
    name: d.name.length > 18 ? `${d.name.substring(0, 16)}...` : d.name,
    fullName: d.name,
    units: d.totalUnitsSold,
    revenue: d.totalRevenue,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
            width={110}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value, name) => [
              name === 'revenue' ? `$${Number(value).toFixed(2)}` : `${value} units`,
              name === 'revenue' ? 'Total Revenue' : 'Units Sold',
            ]}
          />
          <Bar dataKey="units" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

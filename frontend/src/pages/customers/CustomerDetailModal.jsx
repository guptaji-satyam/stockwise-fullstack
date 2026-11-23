import React from 'react';
import { Modal } from '../../components/common/Modal';
import { OrderStatusBadge } from '../../components/common/Badge';
import { Mail, Phone, MapPin, ShoppingBag, Calendar } from 'lucide-react';

export const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  if (!customer) return null;

  const formatCurrency = (val) => `$${Number(val || 0).toFixed(2)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      subtitle="Customer Profile & Purchase History"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-800">{customer.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{customer.email || 'No email registered'}</span>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <span>
                {[
                  customer.address?.street,
                  customer.address?.city,
                  customer.address?.state,
                  customer.address?.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ') || 'No physical address registered'}
              </span>
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-200 sm:pl-4 space-y-2">
            <div className="text-xs">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Total Lifetime Spend
              </span>
              <span className="text-xl font-black text-emerald-600">
                {formatCurrency(customer.totalSpent)}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Total Orders Placed
              </span>
              <span className="text-base font-bold text-slate-800">
                {customer.totalOrders || 0} orders
              </span>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
            <ShoppingBag className="w-4 h-4 mr-1.5 text-blue-600" />
            Order Purchase History
          </h4>

          {customer.orders && customer.orders.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Order #</th>
                    <th className="px-4 py-2.5">Items</th>
                    <th className="px-4 py-2.5">Total</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {customer.orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {ord.items?.length || 0} item{ord.items?.length > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {formatCurrency(ord.total)}
                      </td>
                      <td className="px-4 py-2.5">
                        <OrderStatusBadge status={ord.orderStatus} />
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400 whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
              No orders have been recorded for this customer yet.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

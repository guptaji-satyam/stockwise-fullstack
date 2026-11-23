import React from 'react';
import { Modal } from '../../components/common/Modal';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/Badge';
import { Printer, Calendar, User, Phone, MapPin, CreditCard, ShieldCheck } from 'lucide-react';

export const OrderDetailModal = ({ isOpen, onClose, order, onUpdateStatus }) => {
  if (!order) return null;

  const formatCurrency = (val) => `$${Number(val || 0).toFixed(2)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order ${order.orderNumber}`}
      subtitle={`Created on ${new Date(order.createdAt).toLocaleString()}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Status Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-3">
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Order Status</span>
              <div className="mt-0.5">
                <OrderStatusBadge status={order.orderStatus} />
              </div>
            </div>
            <div className="text-xs border-l border-slate-200 pl-3">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Status</span>
              <div className="mt-0.5">
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
            </div>
            <div className="text-xs border-l border-slate-200 pl-3">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Method</span>
              <span className="font-semibold text-slate-800">{order.paymentMethod}</span>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Receipt
          </button>
        </div>

        {/* Customer & Staff Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Customer Details
            </span>
            <p className="font-bold text-slate-900 text-sm">{order.customer?.name}</p>
            <p className="text-slate-600 flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              {order.customer?.phone}
            </p>
            {order.customer?.email && (
              <p className="text-slate-600">{order.customer.email}</p>
            )}
            {order.customer?.address?.street && (
              <p className="text-slate-500 pt-1">
                {[
                  order.customer.address.street,
                  order.customer.address.city,
                  order.customer.address.state,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Fulfillment & Origin
            </span>
            <p className="text-slate-700">
              <span className="text-slate-400">Handled by:</span>{' '}
              <span className="font-semibold text-slate-900">{order.createdBy?.name || 'Staff User'}</span>
            </p>
            <p className="text-slate-700">
              <span className="text-slate-400">Order Date:</span>{' '}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            {order.notes && (
              <p className="text-slate-600 pt-1 italic">
                <span className="text-slate-400 not-italic font-semibold">Notes:</span> {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Item Description</th>
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-center">Qty</th>
                <th className="px-4 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {order.items?.map((it, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{it.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{it.sku || '—'}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(it.price)}</td>
                  <td className="px-4 py-3 text-center font-bold">{it.quantity}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(it.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount ({order.discountType}):</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax:</span>
                <span>+{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

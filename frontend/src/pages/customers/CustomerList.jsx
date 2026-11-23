import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { CustomerModal } from './CustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers({
        search,
        page: currentPage,
        limit: 10,
      });
      if (res.success) {
        setCustomers(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, currentPage]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setIsModalOpen(true);
  };

  const handleViewDetail = async (cust) => {
    try {
      const res = await customerService.getCustomerById(cust._id);
      if (res.success) {
        setSelectedCustomer(res.data);
        setIsDetailOpen(true);
      }
    } catch (err) {
      toast.error('Could not fetch customer history');
    }
  };

  const handleSaveCustomer = async (formData) => {
    try {
      setActionLoading(true);
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer._id, formData);
        toast.success(`Customer '${formData.name}' updated`);
      } else {
        await customerService.createCustomer(formData);
        toast.success(`Customer '${formData.name}' added`);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setActionLoading(true);
      await customerService.deleteCustomer(customerToDelete._id);
      toast.success('Customer deleted');
      setIsDeleteOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete customer');
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain customer relationship profiles, contact data, and purchase history.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer name, phone, or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading customers..." />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers registered"
            description="Start building your client directory by adding your first customer."
            action={
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Add Customer
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">City / Location</th>
                  <th className="px-5 py-3.5">Orders</th>
                  <th className="px-5 py-3.5">Total Spend</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          <span className="text-[11px] text-slate-400 block">
                            Member since {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {c.address?.city ? `${c.address.city}, ${c.address.state || ''}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {c.totalOrders || 0}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-600">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleViewDetail(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Purchase History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setCustomerToDelete(c);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCustomer}
        customer={editingCustomer}
        isLoading={actionLoading}
      />

      <CustomerDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        customer={selectedCustomer}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete customer '${customerToDelete?.name}'? Note: Customers with existing orders cannot be deleted.`}
        confirmText="Delete Customer"
        isLoading={actionLoading}
      />
    </div>
  );
};

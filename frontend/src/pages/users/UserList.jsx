import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Plus,
  Shield,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { UserModal } from './UserModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { user: currentLoggedInUser } = useAuth();
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      if (res.success) setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load team members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (formData) => {
    try {
      setActionLoading(true);
      if (editingUser) {
        await userService.updateUser(editingUser._id, formData);
        toast.success(`User '${formData.name}' updated`);
      } else {
        await userService.createUser(formData);
        toast.success(`User '${formData.name}' created`);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(true);
      await userService.deleteUser(userToDelete._id);
      toast.success('User account deleted');
      setIsDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & RBAC Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize team members, designate administrative roles, and manage access privileges.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Staff Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading staff records..." />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No staff users registered"
            description="Add your first staff team member."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => {
                  const isCurrent = u._id === currentLoggedInUser?._id;
                  const isAdminRole = u.role === 'admin';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {u.name} {isCurrent && <span className="text-[10px] text-blue-600 font-semibold">(You)</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Joined {new Date(u.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{u.email}</td>
                      <td className="px-5 py-3.5 text-slate-600">{u.phone || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isAdminRole
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          <span className="capitalize">{u.role}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isActive ? (
                          <span className="inline-flex items-center text-emerald-600 font-medium text-xs">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-500 font-medium text-xs">
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => {
                                setUserToDelete(u);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveUser}
        user={editingUser}
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete staff user '${userToDelete?.name}'? They will no longer be able to log in.`}
        confirmText="Delete User"
        isLoading={actionLoading}
      />
    </div>
  );
};

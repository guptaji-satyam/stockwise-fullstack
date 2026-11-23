import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { CategoryModal } from './CategoryModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { isAdmin } = useAuth();
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories();
      if (res.success) setCategories(res.data);
    } catch (err) {
      toast.error('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (formData) => {
    try {
      setActionLoading(true);
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, formData);
        toast.success(`Category '${formData.name}' updated`);
      } else {
        await categoryService.createCategory(formData);
        toast.success(`Category '${formData.name}' created`);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setActionLoading(true);
      await categoryService.deleteCategory(categoryToDelete._id);
      toast.success('Category removed');
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete category');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Categories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Group your products into catalog departments for organized inventory tracking.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Category
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading categories..." />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No categories found"
          description="Create your first product category to begin cataloging products."
          action={
            isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                Create Category
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCategoryToDelete(cat);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{cat.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {cat.description || 'No description provided'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center">
                  <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {cat.productCount || 0} active product{cat.productCount !== 1 ? 's' : ''}
                </span>
                <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                  /{cat.slug}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCategory}
        category={editingCategory}
        isLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete category '${categoryToDelete?.name}'? Note: Categories with active assigned products cannot be removed.`}
        confirmText="Delete Category"
        isLoading={actionLoading}
      />
    </div>
  );
};

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { ProductList } from '../pages/products/ProductList';
import { CategoryList } from '../pages/categories/CategoryList';
import { InventoryList } from '../pages/inventory/InventoryList';
import { CustomerList } from '../pages/customers/CustomerList';
import { OrderList } from '../pages/orders/OrderList';
import { CreateOrder } from '../pages/orders/CreateOrder';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { UserList } from '../pages/users/UserList';
import { NotFound } from '../pages/NotFound';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Application Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/new" element={<CreateOrder />} />

        {/* Admin Only Routes */}
        <Route
          path="reports"
          element={
            <ProtectedRoute adminOnly>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute adminOnly>
              <UserList />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

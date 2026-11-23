import React from 'react';
import { Menu, Bell, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = ({ onOpenSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-slate-800">
            StockWise Enterprise Portal
          </h1>
          <p className="text-[11px] text-slate-400">Inventory & Point of Sale Management</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Role Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span className="capitalize">{user?.role || 'Staff'} Account</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-semibold text-slate-800 leading-tight">
              {user?.name}
            </span>
            <span className="block text-[10px] text-slate-400 truncate max-w-[120px]">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

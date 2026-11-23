import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 shadow-sm ring-8 ring-rose-50/50">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm transition"
        >
          <Home className="w-4 h-4 mr-2" />
          Dashboard
        </Link>
      </div>
    </div>
  );
};

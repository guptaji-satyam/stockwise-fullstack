import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-2 py-6">
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      <span className="text-slate-500 text-sm font-medium">{text}</span>
    </div>
  );
};

import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200"></div>
        <div className="h-12 w-12 rounded-full border-4 border-brand-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{message}</p>
    </div>
  );
};

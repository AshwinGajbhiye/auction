import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-24 space-y-4 max-w-md mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <GraduationCap className="h-8 w-8" />
      </div>
      <h1 className="font-display font-extrabold text-3xl text-slate-900">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 leading-relaxed">
        The page or listing you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="inline-block mt-4 gradient-brand text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-xs hover:opacity-95 transition-all"
      >
        Back to Campus Marketplace
      </Link>
    </div>
  );
};

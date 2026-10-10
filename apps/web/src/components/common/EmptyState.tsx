import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300 max-w-lg mx-auto">
      <div className="h-16 w-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-display font-bold text-lg text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center justify-center mt-6 gradient-brand text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-xs hover:opacity-95 transition-all"
        >
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center mt-6 gradient-brand text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-xs hover:opacity-95 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string; // e.g. "text-indigo-600 bg-indigo-50 border-indigo-100"
  trend?: {
    value: number; // percentage, e.g. 12.5
    isPositive?: boolean;
    period?: string; // e.g. "vs last week"
  };
  isLoading?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-indigo-600 bg-indigo-50 border-indigo-100',
  trend,
  isLoading = false,
  onClick,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs animate-pulse space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="w-10 h-10 rounded-lg bg-slate-200" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-32" />
        <div className="h-3 bg-slate-200 rounded w-20" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <span className="text-2xl font-bold text-slate-900 tracking-tight block">{value}</span>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive !== false
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.isPositive !== false ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </span>
          )}

          {subtitle && (
            <span className="text-xs text-slate-500 font-normal">
              {trend?.period ? `${trend.period}` : subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

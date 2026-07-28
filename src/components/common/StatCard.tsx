/**
 * Componente KPI StatCard - Previncendios España
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  colorTheme?: 'red' | 'amber' | 'emerald' | 'blue' | 'purple';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorTheme = 'red',
  onClick,
}) => {
  const themeStyles = {
    red: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-900/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900 ${
        onClick ? 'cursor-pointer hover:border-gray-300 hover:shadow-md dark:hover:border-gray-700' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className={`rounded-xl border p-2.5 ${themeStyles[colorTheme]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

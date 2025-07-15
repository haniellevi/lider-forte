"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className = "",
  color = 'blue'
}: StatsCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          background: 'bg-green-500',
          iconBg: 'bg-green-100 dark:bg-green-900/20',
          iconColor: 'text-green-600 dark:text-green-400',
        };
      case 'purple':
        return {
          background: 'bg-purple-500',
          iconBg: 'bg-purple-100 dark:bg-purple-900/20',
          iconColor: 'text-purple-600 dark:text-purple-400',
        };
      case 'orange':
        return {
          background: 'bg-orange-500',
          iconBg: 'bg-orange-100 dark:bg-orange-900/20',
          iconColor: 'text-orange-600 dark:text-orange-400',
        };
      case 'red':
        return {
          background: 'bg-red-500',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
        };
      default:
        return {
          background: 'bg-blue-500',
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  const colorClasses = getColorClasses(color);

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value === 0) {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
    
    return trend.isPositive ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value === 0) return 'text-gray-500';
    return trend.isPositive ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {title}
            </h3>
            <div className={`p-2 rounded-lg ${colorClasses.iconBg}`}>
              <div className={`h-5 w-5 ${colorClasses.iconColor}`}>
                {icon}
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h2>
            
            {trend && (
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {trend.value > 0 ? '+' : ''}{trend.value}
                </span>
              </div>
            )}
          </div>
          
          {trend && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {trend.label}
            </p>
          )}
        </div>
      </div>
      
      {/* Progress bar indicator (optional visual enhancement) */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className={`h-1 rounded-full ${colorClasses.background}`}
            style={{
              width: trend ? `${Math.min(Math.abs(trend.value) * 10, 100)}%` : '0%'
            }}
          />
        </div>
      </div>
    </div>
  );
}
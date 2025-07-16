"use client";

import { useTranslations } from "next-intl";
import { 
  Activity, 
  UserPlus, 
  Building, 
  Mail, 
  Users,
  MoreHorizontal 
} from "lucide-react";
import { useDashboardData } from "@/hooks/queries/useDashboard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentActivityProps {
  limit?: number;
  className?: string;
}

export function RecentActivity({ limit = 10, className = "" }: RecentActivityProps) {
  const t = useTranslations("Dashboard");
  const { data: dashboardData, isLoading } = useDashboardData();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_joined':
        return <UserPlus className="h-4 w-4" />;
      case 'church_created':
        return <Building className="h-4 w-4" />;
      case 'invite_sent':
        return <Mail className="h-4 w-4" />;
      case 'cell_created':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_joined':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'church_created':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'invite_sent':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cell_created':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activities = dashboardData?.recentActivities?.slice(0, limit) || [];

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("recentActivity.title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("recentActivity.subtitle")}
            </p>
          </div>
        </div>
        
        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Activities List */}
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* Activity Icon */}
              <div className={`flex-shrink-0 p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    
                    {activity.user && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.user.full_name || activity.user.email} • {activity.user.email}
                      </p>
                    )}
                    
                    {activity.church && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.church.name}
                      </p>
                    )}
                  </div>
                  
                  <time className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                    {formatTime(activity.timestamp)}
                  </time>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("recentActivity.noActivity")}
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            {t("recentActivity.noActivityDescription")}
          </p>
        </div>
      )}

      {/* View All Link */}
      {activities.length >= limit && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
            {t("recentActivity.viewAll")}
          </button>
        </div>
      )}
    </div>
  );
}
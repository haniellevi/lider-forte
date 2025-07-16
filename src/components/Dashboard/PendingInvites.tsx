"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Clock, 
  ExternalLink,
  User,
  MoreHorizontal 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardData } from "@/hooks/queries/useDashboard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingInvitesProps {
  limit?: number;
  className?: string;
}

export function PendingInvites({ limit = 5, className = "" }: PendingInvitesProps) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const { data: dashboardData, isLoading } = useDashboardData();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "leader":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "member":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const invites = dashboardData?.pendingInvites?.slice(0, limit) || [];

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
            <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("pendingInvites.title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pendingInvites.subtitle")}
            </p>
          </div>
        </div>
        
        {invites.length > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            {invites.length}
          </Badge>
        )}
      </div>

      {/* Invites List */}
      {invites.length > 0 ? (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div 
              key={invite.id} 
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {/* User Avatar */}
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              
              {/* Invite Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {invite.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleBadgeColor(invite.role)}>
                        {t(`roles.${invite.role}`)}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        • {invite.church_name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-2">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(invite.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("pendingInvites.noInvites")}
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t("pendingInvites.noInvitesDescription")}
          </p>
          <Button
            onClick={() => router.push('/app/users')}
            variant="outline"
            size="small"
            icon={<Mail className="h-4 w-4" />}
          >
            {t("pendingInvites.sendInvite")}
          </Button>
        </div>
      )}

      {/* View All Link */}
      {invites.length >= limit && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => router.push('/app/users')}
            variant="outline"
            size="small"
            icon={<ExternalLink className="h-4 w-4" />}
            className="w-full"
          >
            {t("pendingInvites.viewAll")}
          </Button>
        </div>
      )}
    </div>
  );
}
"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  UserPlus, 
  Building, 
  Users, 
  Settings, 
  FileText,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUserProfile } from "@/hooks/queries/useUsers";

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  disabled?: boolean;
}

function QuickActionCard({ 
  icon, 
  title, 
  description, 
  onClick, 
  color = 'blue',
  disabled = false 
}: QuickActionProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          button: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/20',
          icon: 'text-green-600 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800',
        };
      case 'purple':
        return {
          button: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/10 dark:hover:bg-purple-900/20',
          icon: 'text-purple-600 dark:text-purple-400',
          border: 'border-purple-200 dark:border-purple-800',
        };
      case 'orange':
        return {
          button: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20',
          icon: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-200 dark:border-orange-800',
        };
      default:
        return {
          button: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20',
          icon: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800',
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-4 rounded-lg border transition-all duration-200 text-left
        ${disabled 
          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50 dark:bg-gray-800 dark:border-gray-700' 
          : `${colorClasses.button} ${colorClasses.border} hover:shadow-md`
        }
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${disabled ? 'text-gray-400' : colorClasses.icon}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
            {title}
          </h3>
          <p className={`text-xs mt-1 ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className = "" }: QuickActionsProps) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const { data: profile } = useCurrentUserProfile();

  const isAdmin = profile?.role === 'pastor';
  const isLeader = profile?.role === 'leader' || isAdmin;
  const hasChurch = !!profile?.church_id;

  const actions = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: t("quickActions.inviteUser.title"),
      description: t("quickActions.inviteUser.description"),
      onClick: () => router.push('/app/users'),
      color: 'green' as const,
      disabled: !hasChurch || !isLeader,
    },
    {
      icon: <Building className="h-5 w-5" />,
      title: t("quickActions.manageChurch.title"),
      description: t("quickActions.manageChurch.description"),
      onClick: () => router.push(hasChurch ? '/app/settings/church' : '/app/churches/new'),
      color: 'blue' as const,
      disabled: false,
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: t("quickActions.viewUsers.title"),
      description: t("quickActions.viewUsers.description"),
      onClick: () => router.push('/app/users'),
      color: 'purple' as const,
      disabled: !hasChurch,
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: t("quickActions.generateReport.title"),
      description: t("quickActions.generateReport.description"),
      onClick: () => {
        // TODO: Implement report generation
        console.log('Generate report');
      },
      color: 'orange' as const,
      disabled: !hasChurch || !isLeader,
    },
  ];

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("quickActions.title")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("quickActions.subtitle")}
          </p>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <QuickActionCard
            key={index}
            icon={action.icon}
            title={action.title}
            description={action.description}
            onClick={action.onClick}
            color={action.color}
            disabled={action.disabled}
          />
        ))}
      </div>

      {/* Help Text */}
      {!hasChurch && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <Plus className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {t("quickActions.getStarted.title")}
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                {t("quickActions.getStarted.description")}
              </p>
              <Button
                onClick={() => router.push('/app/churches/new')}
                variant="outline"
                size="small"
                className="mt-3"
              >
                {t("quickActions.getStarted.action")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
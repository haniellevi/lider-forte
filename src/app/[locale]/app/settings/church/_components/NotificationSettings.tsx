"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Mail, MessageSquare, Users, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/FormElements/switch";
import { toast } from "sonner";

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  newMemberJoined: boolean;
  inviteAccepted: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
}

export function NotificationSettings() {
  const t = useTranslations("ChurchSettings");
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newMemberJoined: true,
    inviteAccepted: true,
    weeklyReport: true,
    monthlyReport: false,
    systemUpdates: true,
    securityAlerts: true,
  });

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save notification preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t("notifications.saved"));
    } catch (error) {
      toast.error(t("notifications.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const notificationChannels = [
    {
      key: 'emailNotifications' as const,
      icon: <Mail className="h-5 w-5" />,
      title: t("notifications.channels.email.title"),
      description: t("notifications.channels.email.description"),
    },
    {
      key: 'smsNotifications' as const,
      icon: <MessageSquare className="h-5 w-5" />,
      title: t("notifications.channels.sms.title"),
      description: t("notifications.channels.sms.description"),
    },
    {
      key: 'pushNotifications' as const,
      icon: <Bell className="h-5 w-5" />,
      title: t("notifications.channels.push.title"),
      description: t("notifications.channels.push.description"),
    },
  ];

  const notificationTypes = [
    {
      key: 'newMemberJoined' as const,
      icon: <Users className="h-5 w-5" />,
      title: t("notifications.types.newMember.title"),
      description: t("notifications.types.newMember.description"),
    },
    {
      key: 'inviteAccepted' as const,
      icon: <Mail className="h-5 w-5" />,
      title: t("notifications.types.inviteAccepted.title"),
      description: t("notifications.types.inviteAccepted.description"),
    },
    {
      key: 'weeklyReport' as const,
      icon: <Bell className="h-5 w-5" />,
      title: t("notifications.types.weeklyReport.title"),
      description: t("notifications.types.weeklyReport.description"),
    },
    {
      key: 'monthlyReport' as const,
      icon: <Bell className="h-5 w-5" />,
      title: t("notifications.types.monthlyReport.title"),
      description: t("notifications.types.monthlyReport.description"),
    },
    {
      key: 'systemUpdates' as const,
      icon: <Bell className="h-5 w-5" />,
      title: t("notifications.types.systemUpdates.title"),
      description: t("notifications.types.systemUpdates.description"),
    },
    {
      key: 'securityAlerts' as const,
      icon: <Bell className="h-5 w-5" />,
      title: t("notifications.types.securityAlerts.title"),
      description: t("notifications.types.securityAlerts.description"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Notification Channels */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("notifications.channelsTitle")}
        </h3>
        <div className="space-y-4">
          {notificationChannels.map((channel) => (
            <div key={channel.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600 dark:text-blue-400">
                  {channel.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {channel.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {channel.description}
                  </p>
                </div>
              </div>
              <Switch />
            </div>
          ))}
        </div>
      </div>

      {/* Notification Types */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("notifications.typesTitle")}
        </h3>
        <div className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-green-600 dark:text-green-400">
                  {type.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {type.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {type.description}
                  </p>
                </div>
              </div>
              <Switch />
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
          {t("notifications.securityNote.title")}
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          {t("notifications.securityNote.description")}
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          icon={<Save className="h-4 w-4" />}
        >
          {isLoading ? t("notifications.saving") : t("notifications.save")}
        </Button>
      </div>
    </div>
  );
}
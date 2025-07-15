"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Building, 
  Bell, 
  Palette, 
  Settings, 
  Shield,
  Globe 
} from "lucide-react";
import { ChurchSetupForm } from "@/components/Forms/ChurchSetupForm";
import { NotificationSettings } from "./NotificationSettings";
import { ThemeSettings } from "./ThemeSettings";
import { PreferencesSettings } from "./PreferencesSettings";

type SettingsTab = 'general' | 'notifications' | 'theme' | 'preferences';

export function ChurchSettingsContent() {
  const t = useTranslations("ChurchSettings");
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs = [
    {
      id: 'general' as const,
      name: t("tabs.general"),
      icon: <Building className="h-5 w-5" />,
      description: t("tabs.generalDescription"),
    },
    {
      id: 'notifications' as const,
      name: t("tabs.notifications"),
      icon: <Bell className="h-5 w-5" />,
      description: t("tabs.notificationsDescription"),
    },
    {
      id: 'theme' as const,
      name: t("tabs.theme"),
      icon: <Palette className="h-5 w-5" />,
      description: t("tabs.themeDescription"),
    },
    {
      id: 'preferences' as const,
      name: t("tabs.preferences"),
      icon: <Settings className="h-5 w-5" />,
      description: t("tabs.preferencesDescription"),
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <ChurchSetupForm />;
      case 'notifications':
        return <NotificationSettings />;
      case 'theme':
        return <ThemeSettings />;
      case 'preferences':
        return <PreferencesSettings />;
      default:
        return <ChurchSetupForm />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full text-left p-4 rounded-lg border transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-boxdark dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    ${activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                    }
                  `}>
                    {tab.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {tab.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {tab.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark">
            {/* Tab Header */}
            <div className="border-b border-stroke dark:border-strokedark px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600 dark:text-blue-400">
                  {tabs.find(tab => tab.id === activeTab)?.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {tabs.find(tab => tab.id === activeTab)?.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
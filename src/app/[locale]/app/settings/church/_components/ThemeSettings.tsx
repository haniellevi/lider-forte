"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Palette, Monitor, Sun, Moon, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ThemeSettings() {
  const t = useTranslations("ChurchSettings");
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [accentColor, setAccentColor] = useState('#3B82F6');

  const themeOptions = [
    {
      value: 'light',
      label: t("theme.light"),
      description: t("theme.lightDescription"),
      icon: <Sun className="h-5 w-5" />,
    },
    {
      value: 'dark',
      label: t("theme.dark"),
      description: t("theme.darkDescription"),
      icon: <Moon className="h-5 w-5" />,
    },
    {
      value: 'system',
      label: t("theme.system"),
      description: t("theme.systemDescription"),
      icon: <Monitor className="h-5 w-5" />,
    },
  ];

  const accentColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save theme preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t("theme.saved"));
    } catch (error) {
      toast.error(t("theme.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("theme.themeTitle")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${theme === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  ${theme === option.value
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                  }
                `}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
                {theme === option.value && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("theme.accentColorTitle")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t("theme.accentColorDescription")}
        </p>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => setAccentColor(color.value)}
              className={`
                relative w-12 h-12 rounded-lg border-2 transition-all duration-200
                ${accentColor === color.value
                  ? 'border-gray-400 dark:border-gray-500 scale-110'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {accentColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t("theme.previewTitle")}
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {t("theme.previewComponent")}
              </h4>
              <div 
                className="px-3 py-1 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: accentColor }}
              >
                {t("theme.previewButton")}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Note */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
          {t("theme.accessibilityNote.title")}
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          {t("theme.accessibilityNote.description")}
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          icon={<Save className="h-4 w-4" />}
        >
          {isLoading ? t("theme.saving") : t("theme.save")}
        </Button>
      </div>
    </div>
  );
}
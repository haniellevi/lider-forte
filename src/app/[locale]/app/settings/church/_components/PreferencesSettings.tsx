"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Globe, 
  Calendar, 
  Users, 
  FileText, 
  Save,
  Clock,
  MapPin 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/FormElements/select";
import { Switch } from "@/components/FormElements/switch";
import { FormInput } from "@/components/FormElements/enhanced";
import { useFormValidation } from "@/hooks/useFormValidation";
import { z } from "zod";
import { toast } from "sonner";

const PreferencesSchema = z.object({
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  currency: z.string(),
  weekStartsOn: z.string(),
  churchVisibility: z.boolean(),
  allowPublicRegistration: z.boolean(),
  requireApprovalForMembers: z.boolean(),
  enableCellGroups: z.boolean(),
  enableReports: z.boolean(),
  maxMembersPerCell: z.string().optional(),
  defaultMemberRole: z.string(),
});

type PreferencesData = z.infer<typeof PreferencesSchema>;

export function PreferencesSettings() {
  const t = useTranslations("ChurchSettings");
  const [isLoading, setIsLoading] = useState(false);

  const formContext = useFormValidation({
    schema: PreferencesSchema,
    onSubmit: async (data: PreferencesData) => {
      setIsLoading(true);
      try {
        // TODO: Implement API call to save preferences
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(t("preferences.saved"));
      } catch (error) {
        toast.error(t("preferences.error"));
      } finally {
        setIsLoading(false);
      }
    },
    defaultValues: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
      currency: 'BRL',
      weekStartsOn: 'sunday',
      churchVisibility: true,
      allowPublicRegistration: false,
      requireApprovalForMembers: true,
      enableCellGroups: true,
      enableReports: true,
      maxMembersPerCell: '12',
      defaultMemberRole: 'member',
    },
  });

  const languageOptions = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  const timezoneOptions = [
    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Madrid', label: 'Madrid (CET)' },
  ];

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: '31/12/2023' },
    { value: 'MM/DD/YYYY', label: '12/31/2023' },
    { value: 'YYYY-MM-DD', label: '2023-12-31' },
  ];

  const currencyOptions = [
    { value: 'BRL', label: 'Real (R$)' },
    { value: 'USD', label: 'Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
  ];

  const weekStartOptions = [
    { value: 'sunday', label: t("preferences.weekStart.sunday") },
    { value: 'monday', label: t("preferences.weekStart.monday") },
  ];

  const roleOptions = [
    { value: 'member', label: t("roles.member") },
    { value: 'leader', label: t("roles.leader") },
  ];

  return (
    <form onSubmit={formContext.handleSubmit} className="space-y-8">
      {/* Localization Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>{t("preferences.localizationTitle")}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label={t("preferences.language")}
            placeholder={t("preferences.selectLanguage")}
            items={languageOptions}
            defaultValue={"pt"}
          />
          
          <Select
            label={t("preferences.timezone")}
            placeholder={t("preferences.selectTimezone")}
            items={timezoneOptions}
            defaultValue={formContext.watch("timezone")}
            onChange={(value) => formContext.setValue("timezone", value)}
            icon={<Clock className="h-4 w-4" />}
          />
          
          <Select
            label={t("preferences.dateFormat")}
            placeholder={t("preferences.selectDateFormat")}
            items={dateFormatOptions}
            defaultValue={formContext.watch("dateFormat")}
            onChange={(value) => formContext.setValue("dateFormat", value)}
            icon={<Calendar className="h-4 w-4" />}
          />
          
          <Select
            label={t("preferences.currency")}
            placeholder={t("preferences.selectCurrency")}
            items={currencyOptions}
            defaultValue={formContext.watch("currency")}
            onChange={(value) => formContext.setValue("currency", value)}
          />
        </div>
      </div>

      {/* Church Management Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>{t("preferences.managementTitle")}</span>
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label={t("preferences.weekStartsOn")}
              placeholder={t("preferences.selectWeekStart")}
              items={weekStartOptions}
              defaultValue={formContext.watch("weekStartsOn")}
              onChange={(value) => formContext.setValue("weekStartsOn", value)}
            />
            
            <Select
              label={t("preferences.defaultMemberRole")}
              placeholder={t("preferences.selectDefaultRole")}
              items={roleOptions}
              defaultValue={formContext.watch("defaultMemberRole")}
              onChange={(value) => formContext.setValue("defaultMemberRole", value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t("preferences.churchVisibility.title")}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("preferences.churchVisibility.description")}
                </p>
              </div>
              <Switch
                checked={formContext.watch("churchVisibility")}
                onCheckedChange={(checked) => formContext.setValue("churchVisibility", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t("preferences.allowPublicRegistration.title")}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("preferences.allowPublicRegistration.description")}
                </p>
              </div>
              <Switch
                checked={formContext.watch("allowPublicRegistration")}
                onCheckedChange={(checked) => formContext.setValue("allowPublicRegistration", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t("preferences.requireApprovalForMembers.title")}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("preferences.requireApprovalForMembers.description")}
                </p>
              </div>
              <Switch
                checked={formContext.watch("requireApprovalForMembers")}
                onCheckedChange={(checked) => formContext.setValue("requireApprovalForMembers", checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{t("preferences.featuresTitle")}</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {t("preferences.enableCellGroups.title")}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("preferences.enableCellGroups.description")}
              </p>
            </div>
            <Switch
              checked={formContext.watch("enableCellGroups")}
              onCheckedChange={(checked) => formContext.setValue("enableCellGroups", checked)}
            />
          </div>

          {formContext.watch("enableCellGroups") && (
            <div className="ml-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
              <FormInput
                name="maxMembersPerCell"
                label={t("preferences.maxMembersPerCell")}
                type="number"
                placeholder="12"
                formContext={formContext}
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {t("preferences.enableReports.title")}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("preferences.enableReports.description")}
              </p>
            </div>
            <Switch
              checked={formContext.watch("enableReports")}
              onCheckedChange={(checked) => formContext.setValue("enableReports", checked)}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="submit"
          disabled={formContext.isSubmitting}
          icon={<Save className="h-4 w-4" />}
        >
          {formContext.isSubmitting ? t("preferences.saving") : t("preferences.save")}
        </Button>
      </div>
    </form>
  );
}
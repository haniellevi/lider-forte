"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ValidatedInput, FormInput } from "@/components/FormElements/enhanced";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/TextArea";
import { useFormValidation } from "@/hooks/useFormValidation";
import { cnpjSchema, addressSchema } from "@/lib/validations/brazilian";
import { useUpdateChurch, useCurrentChurch } from "@/hooks/queries/useChurches";

const ChurchSetupSchema = z.object({
  name: z.string().min(2, "Nome da igreja deve ter pelo menos 2 caracteres"),
  cnpj: cnpjSchema.optional(),
  address: addressSchema.partial().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  website: z.string().url("URL inválida").optional(),
  description: z.string().optional(),
  founded_date: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  values: z.array(z.string()).optional(),
});

type ChurchSetupData = z.infer<typeof ChurchSetupSchema>;

export function ChurchSetupForm() {
  const t = useTranslations("ChurchSettings");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: currentChurch, isLoading } = useCurrentChurch();
  const updateChurch = useUpdateChurch();

  const formContext = useFormValidation({
    schema: ChurchSetupSchema,
    onSubmit: async (data: ChurchSetupData) => {
      setIsSubmitting(true);
      try {
        await updateChurch.mutateAsync(data);
        toast.success(t("form.success"));
      } catch (error) {
        toast.error(t("form.error"));
      } finally {
        setIsSubmitting(false);
      }
    },
    defaultValues: {
      name: currentChurch?.name || "",
      cnpj: currentChurch?.cnpj || "",
      phone: currentChurch?.phone || "",
      email: currentChurch?.email || "",
      website: currentChurch?.website || "",
      description: currentChurch?.description || "",
      founded_date: currentChurch?.founded_date || "",
      vision: currentChurch?.vision || "",
      mission: currentChurch?.mission || "",
      values: currentChurch?.values || [],
    },
  });


  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
      </div>
    );
  }

  return (
    <form onSubmit={formContext.handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          name="name"
          label={t("form.name")}
          placeholder={t("form.namePlaceholder")}
          required
          formContext={formContext}
        />

        <FormInput
          name="cnpj"
          label={t("form.cnpj")}
          placeholder="00.000.000/0001-00"
          formContext={formContext}
        />
      </div>

      {/* Contato */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          name="phone"
          label={t("form.phone")}
          placeholder="(11) 99999-9999"
          formContext={formContext}
        />

        <FormInput
          name="email"
          label={t("form.email")}
          type="email"
          placeholder="contato@igreja.com"
          formContext={formContext}
        />
      </div>

      {/* Website e Data de Fundação */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          name="website"
          label={t("form.website")}
          type="url"
          placeholder="https://www.igreja.com"
          formContext={formContext}
        />

        <FormInput
          name="founded_date"
          label={t("form.foundedDate")}
          type="date"
          formContext={formContext}
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <TextAreaGroup
          label={t("form.description")}
          placeholder={t("form.descriptionPlaceholder")}
          {...formContext.register("description")}
        />
        {formContext.errors.description && (
          <p className="text-sm text-red-600">{formContext.errors.description.message}</p>
        )}
      </div>

      {/* Visão */}
      <div className="space-y-2">
        <TextAreaGroup
          label={t("form.vision")}
          placeholder={t("form.visionPlaceholder")}
          {...formContext.register("vision")}
        />
        {formContext.errors.vision && (
          <p className="text-sm text-red-600">{formContext.errors.vision.message}</p>
        )}
      </div>

      {/* Missão */}
      <div className="space-y-2">
        <TextAreaGroup
          label={t("form.mission")}
          placeholder={t("form.missionPlaceholder")}
          {...formContext.register("mission")}
        />
        {formContext.errors.mission && (
          <p className="text-sm text-red-600">{formContext.errors.mission.message}</p>
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          {t("form.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={formContext.isSubmitting}
          variant="primary"
        >
          {formContext.isSubmitting ? t("form.saving") : t("form.save")}
        </Button>
      </div>
    </form>
  );
}
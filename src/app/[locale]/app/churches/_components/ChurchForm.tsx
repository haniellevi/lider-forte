"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useChurch, useCreateChurch, useUpdateChurch } from "@/hooks/queries/useChurches";
import { cnpjSchema, phoneSchema } from "@/lib/validations/brazilian";

// Schema de validação completo
const ChurchFormSchema = z.object({
  name: z.string().min(2, "Nome da igreja deve ter pelo menos 2 caracteres"),
  cnpj: cnpjSchema.optional(),
  
  // Endereço completo
  address: z.object({
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  
  // Contato
  phone: phoneSchema.optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  
  // Informações institucionais
  description: z.string().optional(),
  founded_date: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  values: z.array(z.string()).optional(),
});

type ChurchFormData = z.infer<typeof ChurchFormSchema>;

interface ChurchFormProps {
  churchId?: string;
}

export default function ChurchForm({ churchId }: ChurchFormProps) {
  const t = useTranslations("ChurchForm");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [valuesInput, setValuesInput] = useState("");

  const isEdit = !!churchId;
  
  // Queries e mutations
  const { data: church, isLoading: isLoadingChurch } = useChurch(churchId || "");
  const createChurchMutation = useCreateChurch();
  const updateChurchMutation = useUpdateChurch();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm<ChurchFormData>({
    resolver: zodResolver(ChurchFormSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      address: {
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
      phone: "",
      email: "",
      website: "",
      description: "",
      founded_date: "",
      vision: "",
      mission: "",
      values: [],
    }
  });

  // Preencher form com dados existentes
  useEffect(() => {
    if (church && isEdit) {
      reset({
        name: church.name || "",
        cnpj: church.cnpj || "",
        address: {
          zipCode: church.address?.zipCode || "",
          street: church.address?.street || "",
          number: church.address?.number || "",
          complement: church.address?.complement || "",
          neighborhood: church.address?.neighborhood || "",
          city: church.address?.city || "",
          state: church.address?.state || "",
        },
        phone: church.phone || "",
        email: church.email || "",
        website: church.website || "",
        description: church.description || "",
        founded_date: church.founded_date ? church.founded_date.split('T')[0] : "",
        vision: church.vision || "",
        mission: church.mission || "",
        values: church.values || [],
      });
      setValuesInput(church.values?.join(", ") || "");
    }
  }, [church, isEdit, reset]);

  const fetchAddressByZipCode = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setValue("address.street", data.logradouro || "");
        setValue("address.neighborhood", data.bairro || "");
        setValue("address.city", data.localidade || "");
        setValue("address.state", data.uf || "");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  // Buscar CEP automaticamente
  const zipCode = watch("address.zipCode");
  useEffect(() => {
    if (zipCode && zipCode.length === 8) {
      fetchAddressByZipCode(zipCode);
    }
  }, [zipCode, fetchAddressByZipCode]);

  const onSubmit = async (data: ChurchFormData) => {
    setIsSubmitting(true);

    try {
      // Processar valores (string -> array)
      const processedData = {
        ...data,
        values: valuesInput ? valuesInput.split(",").map(v => v.trim()).filter(Boolean) : [],
        founded_date: data.founded_date ? new Date(data.founded_date).toISOString() : undefined,
      };

      if (isEdit && churchId) {
        await updateChurchMutation.mutateAsync({
          id: churchId,
          data: processedData
        });
        toast.success(t("updateSuccess"));
      } else {
        await createChurchMutation.mutateAsync(processedData);
        toast.success(t("createSuccess"));
        router.push("/app/churches");
        return;
      }
      
      router.push("/app/churches");
    } catch (error: any) {
      toast.error(error.message || t("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && isLoadingChurch) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {t("sections.basicInfo")}
        </h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Nome da Igreja */}
          <div className="md:col-span-2">
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.name")}
              <span className="text-red">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder={t("placeholders.name")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            {errors.name && (
              <span className="mt-1 text-sm text-red">{errors.name.message}</span>
            )}
          </div>

          {/* CNPJ */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.cnpj")}
            </label>
            <input
              {...register("cnpj")}
              type="text"
              placeholder={t("placeholders.cnpj")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            {errors.cnpj && (
              <span className="mt-1 text-sm text-red">{errors.cnpj.message}</span>
            )}
          </div>

          {/* Data de Fundação */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.foundedDate")}
            </label>
            <input
              {...register("founded_date")}
              type="date"
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {t("sections.address")}
        </h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* CEP */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.zipCode")}
            </label>
            <input
              {...register("address.zipCode")}
              type="text"
              placeholder={t("placeholders.zipCode")}
              maxLength={8}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.state")}
            </label>
            <input
              {...register("address.state")}
              type="text"
              placeholder={t("placeholders.state")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.city")}
            </label>
            <input
              {...register("address.city")}
              type="text"
              placeholder={t("placeholders.city")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Rua */}
          <div className="md:col-span-2">
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.street")}
            </label>
            <input
              {...register("address.street")}
              type="text"
              placeholder={t("placeholders.street")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Número */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.number")}
            </label>
            <input
              {...register("address.number")}
              type="text"
              placeholder={t("placeholders.number")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Bairro */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.neighborhood")}
            </label>
            <input
              {...register("address.neighborhood")}
              type="text"
              placeholder={t("placeholders.neighborhood")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Complemento */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.complement")}
            </label>
            <input
              {...register("address.complement")}
              type="text"
              placeholder={t("placeholders.complement")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Contato */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {t("sections.contact")}
        </h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Telefone */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.phone")}
            </label>
            <input
              {...register("phone")}
              type="tel"
              placeholder={t("placeholders.phone")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            {errors.phone && (
              <span className="mt-1 text-sm text-red">{errors.phone.message}</span>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.email")}
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder={t("placeholders.email")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            {errors.email && (
              <span className="mt-1 text-sm text-red">{errors.email.message}</span>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.website")}
            </label>
            <input
              {...register("website")}
              type="url"
              placeholder={t("placeholders.website")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            {errors.website && (
              <span className="mt-1 text-sm text-red">{errors.website.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Informações Institucionais */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          {t("sections.institutional")}
        </h3>
        
        <div className="space-y-4">
          {/* Descrição */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.description")}
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder={t("placeholders.description")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Visão */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.vision")}
            </label>
            <textarea
              {...register("vision")}
              rows={3}
              placeholder={t("placeholders.vision")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Missão */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.mission")}
            </label>
            <textarea
              {...register("mission")}
              rows={3}
              placeholder={t("placeholders.mission")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {/* Valores */}
          <div>
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              {t("fields.values")}
            </label>
            <input
              type="text"
              value={valuesInput}
              onChange={(e) => setValuesInput(e.target.value)}
              placeholder={t("placeholders.values")}
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <p className="mt-1 text-sm text-dark-6">{t("helpers.values")}</p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex items-center justify-between border-t border-stroke pt-6 dark:border-dark-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-[7px] border border-stroke bg-transparent px-6 py-3 text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark/20"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("buttons.cancel")}
        </button>

        <button
          type="submit"
          disabled={isSubmitting || (!isDirty && isEdit)}
          className="flex items-center gap-2 rounded-[7px] bg-primary px-6 py-3 text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSubmitting
            ? t("buttons.saving")
            : isEdit
            ? t("buttons.update")
            : t("buttons.create")
          }
        </button>
      </div>
    </form>
  );
}
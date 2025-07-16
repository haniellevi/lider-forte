"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield,
  Camera,
  Save,
  ArrowLeft,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput, AddressForm } from "@/components/FormElements/enhanced";
import { Select } from "@/components/FormElements/select";
import { Badge } from "@/components/ui/badge";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/queries/useUsers";
import { validateCPF, formatCPF, formatPhone } from "@/lib/validations/brazilian";
import { toast } from "sonner";

const UserProfileSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  cpf: z.string().optional().refine((cpf) => !cpf || validateCPF(cpf), "CPF inválido"),
  birth_date: z.string().optional(),
  role: z.enum(["admin", "leader", "member"]).optional(),
  
  // Endereço
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  
  // Contato de emergência
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
});

type UserProfileData = z.infer<typeof UserProfileSchema>;

interface UserProfileFormProps {
  userId: string;
}

export function UserProfileForm({ userId }: UserProfileFormProps) {
  const t = useTranslations("UserProfile");
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: user, isLoading } = useUserProfile(userId);
  const updateProfile = useUpdateUserProfile();

  const formContext = useFormValidation({
    schema: UserProfileSchema,
    onSubmit: async (data: UserProfileData) => {
      try {
        const { cpf, phone, ...restData } = data;
        await updateProfile.mutateAsync({
          id: userId,
          ...restData,
        } as any);
        toast.success(t("form.success"));
      } catch (error) {
        toast.error(t("form.error"));
      }
    },
  });

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      // Set form values using setValue method - only use available properties
      formContext.setValue("full_name", user.full_name || "");
      formContext.setValue("role", user.role || "member");
      
      // Only set properties that exist in user object
      if ((user as any).email) formContext.setValue("email", (user as any).email || "");
      if ((user as any).phone) formContext.setValue("phone", (user as any).phone || "");
      if ((user as any).cpf) formContext.setValue("cpf", (user as any).cpf || "");
      if ((user as any).birth_date) formContext.setValue("birth_date", (user as any).birth_date || "");
      if ((user as any).street) formContext.setValue("street", (user as any).street || "");
      if ((user as any).number) formContext.setValue("number", (user as any).number || "");
      if ((user as any).complement) formContext.setValue("complement", (user as any).complement || "");
      if ((user as any).neighborhood) formContext.setValue("neighborhood", (user as any).neighborhood || "");
      if ((user as any).city) formContext.setValue("city", (user as any).city || "");
      if ((user as any).state) formContext.setValue("state", (user as any).state || "");
      if ((user as any).zip_code) formContext.setValue("zip_code", (user as any).zip_code || "");
      if ((user as any).emergency_contact_name) formContext.setValue("emergency_contact_name", (user as any).emergency_contact_name || "");
      if ((user as any).emergency_contact_phone) formContext.setValue("emergency_contact_phone", (user as any).emergency_contact_phone || "");
      if ((user as any).emergency_contact_relationship) formContext.setValue("emergency_contact_relationship", (user as any).emergency_contact_relationship || "");
      
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
    }
  }, [user, formContext]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded dark:bg-gray-700"></div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("form.userNotFound")}</p>
        <Button 
          onClick={() => router.back()} 
          variant="outlineDark" 
          className="mt-4"
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          {t("form.goBack")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={formContext.handleSubmit} className="space-y-8">
      {/* Header with Avatar */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt={user.full_name || "User avatar"} className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-gray-500" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
            <Camera className="h-4 w-4 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {user.full_name}
            </h2>
            <Badge className={getRoleBadgeColor(user.role || "member")}>
              {t(`roles.${user.role || "member"}`)}
            </Badge>
          </div>
          <p className="text-gray-500">{(user as any).email || "No email provided"}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("form.joinedAt", { date: new Date(user.created_at).toLocaleDateString() })}
            </span>
            {(user as any).last_active && (
              <span className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                {t("form.lastActive", { date: new Date((user as any).last_active).toLocaleDateString() })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          name="full_name"
          label={t("form.name")}
          icon={<User className="h-4 w-4" />}
          required
          formContext={formContext}
        />
        
        <FormInput
          name="email"
          label={t("form.email")}
          type="email"
          icon={<Mail className="h-4 w-4" />}
          required
          formContext={formContext}
        />
        
        <FormInput
          name="phone"
          label={t("form.phone")}
          icon={<Phone className="h-4 w-4" />}
          placeholder="(11) 99999-9999"
          formContext={formContext}
        />
        
        <FormInput
          name="cpf"
          label={t("form.cpf")}
          placeholder="000.000.000-00"
          formContext={formContext}
        />
        
        <FormInput
          name="birth_date"
          label={t("form.birthDate")}
          type="date"
          icon={<Calendar className="h-4 w-4" />}
          formContext={formContext}
        />

        <div className="space-y-2">
          <Select
            label={t("form.role")}
            placeholder={t("form.selectRole")}
            items={[
              { value: "member", label: t("roles.member") },
              { value: "leader", label: t("roles.leader") },
              { value: "admin", label: t("roles.admin") }
            ]}
          />
          {formContext.formState.errors.role && (
            <p className="text-sm text-red-600">{formContext.formState.errors.role}</p>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t("form.addressTitle")}
        </h3>
        <AddressForm onSubmit={() => {}} />
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {t("form.emergencyContactTitle")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormInput
            name="emergency_contact_name"
            label={t("form.emergencyContactName")}
            formContext={formContext}
          />
          
          <FormInput
            name="emergency_contact_phone"
            label={t("form.emergencyContactPhone")}
            placeholder="(11) 99999-9999"
            formContext={formContext}
          />
          
          <FormInput
            name="emergency_contact_relationship"
            label={t("form.emergencyContactRelationship")}
            placeholder={t("form.emergencyContactRelationshipPlaceholder")}
            formContext={formContext}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outlineDark"
          onClick={() => router.back()}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          {t("form.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={formContext.formState.isSubmitting}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{formContext.formState.isSubmitting ? t("form.saving") : t("form.save")}</span>
        </Button>
      </div>
    </form>
  );
}
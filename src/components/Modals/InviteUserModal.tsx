"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { X, Mail, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/FormElements/enhanced";
import { Select } from "@/components/FormElements/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useInviteUser } from "@/hooks/queries/useUsers";

const InviteUserSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "leader", "member"], {
    required_error: "Selecione um papel",
  }),
  message: z.string().optional(),
});

type InviteUserData = z.infer<typeof InviteUserSchema>;

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const t = useTranslations("UserManagement");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteStep, setInviteStep] = useState<"form" | "success">("form");
  const [invitedUser, setInvitedUser] = useState<{ email: string; role: string } | null>(null);
  
  const inviteUser = useInviteUser();

  const formContext = useFormValidation({
    schema: InviteUserSchema,
    onSubmit: async (data: InviteUserData) => {
      setIsSubmitting(true);
      try {
        await inviteUser.mutateAsync(data);
        setInvitedUser({ email: data.email, role: data.role });
        setInviteStep("success");
        toast.success(t("invite.success"));
      } catch (error) {
        toast.error(t("invite.error"));
      } finally {
        setIsSubmitting(false);
      }
    },
    defaultValues: {
      role: "member",
    },
  });

  const selectedRole = formContext.watch("role");

  const handleClose = () => {
    formContext.reset();
    setInviteStep("form");
    setInvitedUser(null);
    onClose();
  };


  const handleSuccessClose = () => {
    onSuccess();
    handleClose();
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return t("invite.roleDescriptions.admin");
      case "leader":
        return t("invite.roleDescriptions.leader");
      case "member":
        return t("invite.roleDescriptions.member");
      default:
        return "";
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {inviteStep === "form" ? (
              <>
                <Mail className="h-5 w-5" />
                {t("invite.title")}
              </>
            ) : (
              <>
                <UserCheck className="h-5 w-5 text-green-600" />
                {t("invite.successTitle")}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {inviteStep === "form" ? (
          <form onSubmit={formContext.handleSubmit} className="space-y-4">
            {/* Email */}
            <FormInput
              name="email"
              label={t("invite.email")}
              type="email"
              placeholder="usuario@exemplo.com"
              required
              formContext={formContext}
            />

            {/* Role */}
            <div className="space-y-2">
              <Select
                label={t("invite.role")}
                placeholder={t("invite.selectRole")}
                items={[
                  { value: "member", label: t("roles.member") },
                  { value: "leader", label: t("roles.leader") },
                  { value: "admin", label: t("roles.admin") }
                ]}
                defaultValue={selectedRole}
                onChange={(value) => formContext.setValue("role", value as "admin" | "leader" | "member")}
              />
              {formContext.errors.role && (
                <p className="text-sm text-red-600">{formContext.errors.role.message}</p>
              )}
              {selectedRole && (
                <p className="text-sm text-gray-600">
                  {getRoleDescription(selectedRole)}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <textarea
                {...formContext.register("message")}
                placeholder={t("invite.messagePlaceholder")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("invite.message")} ({t("invite.optional")})
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outlineDark"
                onClick={handleClose}
                disabled={formContext.isSubmitting}
              >
                {t("invite.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={formContext.isSubmitting}
                variant="default"
              >
                {formContext.isSubmitting ? t("invite.sending") : t("invite.send")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                {t("invite.successMessage")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("invite.successDescription")}
              </p>
            </div>

            {invitedUser && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invitedUser.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t("invite.invitedAs")}
                      </p>
                    </div>
                  </div>
                  <Badge className={getRoleBadgeColor(invitedUser.role)}>
                    {t(`roles.${invitedUser.role}`)}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outlineDark"
                onClick={handleSuccessClose}
              >
                {t("invite.close")}
              </Button>
              <Button
                type="button"
                onClick={() => setInviteStep("form")}
                variant="default"
              >
                {t("invite.inviteAnother")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
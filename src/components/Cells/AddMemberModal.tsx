"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  UserPlus, 
  User, 
  X,
  Award,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/FormElements/select";
import { FormInput } from "@/components/FormElements/enhanced";
import { Switch } from "@/components/FormElements/switch";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useAddCellMember } from "@/hooks/queries/useCells";
import { useChurchUsers } from "@/hooks/queries/useUsers";
import { toast } from "sonner";

const AddMemberSchema = z.object({
  profile_id: z.string().min(1, "Selecione um membro"),
  success_ladder_score: z.number().int().min(0).max(100).default(0),
  is_timoteo: z.boolean().default(false),
});

type AddMemberData = z.infer<typeof AddMemberSchema>;

interface AddMemberModalProps {
  cellId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingMemberIds?: string[];
}

export function AddMemberModal({ 
  cellId, 
  isOpen, 
  onClose, 
  onSuccess, 
  existingMemberIds = [] 
}: AddMemberModalProps) {
  const t = useTranslations("Cells");
  const { data: users = [] } = useChurchUsers({});
  const addMember = useAddCellMember();

  const formContext = useFormValidation({
    schema: AddMemberSchema,
    onSubmit: async (data: AddMemberData) => {
      try {
        await addMember.mutateAsync({
          cellId,
          memberData: {
            profile_id: data.profile_id,
            success_ladder_score: data.success_ladder_score,
            is_timoteo: data.is_timoteo,
          }
        });
        
        toast.success(t("members.addSuccess"));
        onSuccess();
        handleClose();
      } catch (error) {
        // Error handling is done in the mutation
      }
    },
    defaultValues: {
      profile_id: "",
      success_ladder_score: 0,
      is_timoteo: false,
    },
  });

  const handleClose = () => {
    formContext.reset();
    onClose();
  };

  // Filter available users (not already in cell)
  const availableUsers = users
    .filter(user => !existingMemberIds.includes(user.id))
    .map(user => ({
      value: user.id,
      label: `${user.full_name || user.email} - ${t(`roles.${user.role || "member"}`)}`,
    }));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            {t("members.addMemberTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={formContext.handleSubmit} className="space-y-6">
          {/* Member Selection */}
          <div className="space-y-2">
            <Select
              label={t("members.selectMember")}
              placeholder={t("members.selectMemberPlaceholder")}
              items={availableUsers}
              defaultValue={formContext.watch("profile_id")}
              onChange={(value) => formContext.setValue("profile_id", value)}
              icon={<User className="h-4 w-4" />}
              required
            />
            {formContext.errors.profile_id && (
              <p className="text-sm text-red-600">{formContext.errors.profile_id.message}</p>
            )}
          </div>

          {/* Success Ladder Score */}
          <div className="space-y-2">
            <FormInput
              name="success_ladder_score"
              label={t("members.successLadderScore")}
              type="number"
              min={0}
              max={100}
              placeholder="0"
              icon={<Award className="h-4 w-4" />}
              formContext={formContext}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("members.successLadderDescription")}
            </p>
          </div>

          {/* Timóteo Status */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                  {t("members.timoteoStatus")}
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  {t("members.timoteoDescription")}
                </p>
              </div>
            </div>
            <Switch
              checked={formContext.watch("is_timoteo")}
              onCheckedChange={(checked) => formContext.setValue("is_timoteo", checked)}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
              {t("members.importantNote")}
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• {t("members.notePoint1")}</li>
              <li>• {t("members.notePoint2")}</li>
              <li>• {t("members.notePoint3")}</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outlineDark"
              onClick={handleClose}
              disabled={formContext.isSubmitting}
            >
              {t("form.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={formContext.isSubmitting || availableUsers.length === 0}
              icon={<UserPlus className="h-4 w-4" />}
            >
              {formContext.isSubmitting ? t("members.adding") : t("members.addMember")}
            </Button>
          </div>

          {availableUsers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("members.noAvailableUsers")}
              </p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
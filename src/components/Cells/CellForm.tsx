"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Building, 
  User, 
  MapPin, 
  Calendar, 
  Clock,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput, AddressForm } from "@/components/FormElements/enhanced";
import { Select } from "@/components/FormElements/select";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useCreateCell, useUpdateCell, useCell } from "@/hooks/queries/useCells";
import { useChurchUsers } from "@/hooks/queries/useUsers";
import { useCells } from "@/hooks/queries/useCells";

const CellFormSchema = z.object({
  name: z.string().min(1, "Nome da célula é obrigatório"),
  leader_id: z.string().min(1, "Líder é obrigatório"),
  supervisor_id: z.string().optional(),
  parent_id: z.string().optional(),
  meeting_day: z.number().int().min(0).max(6).optional(),
  meeting_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário deve estar no formato HH:MM").optional(),
  
  // Address fields
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type CellFormData = z.infer<typeof CellFormSchema>;

interface CellFormProps {
  cellId?: string;
  parentCellId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CellForm({ cellId, parentCellId, onSuccess, onCancel }: CellFormProps) {
  const t = useTranslations("Cells");
  const isEditing = !!cellId;

  const { data: cell } = useCell(cellId || "");
  const { data: usersData } = useChurchUsers({});
  const { data: cellsData } = useCells();
  const createCell = useCreateCell();
  const updateCell = useUpdateCell();

  const formContext = useFormValidation({
    schema: CellFormSchema,
    onSubmit: async (data: CellFormData) => {
      const address = {
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: "Brasil",
      };

      const cellData = {
        name: data.name,
        leader_id: data.leader_id,
        supervisor_id: data.supervisor_id || null,
        parent_id: data.parent_id || parentCellId || null,
        meeting_day: data.meeting_day,
        meeting_time: data.meeting_time,
        address: Object.values(address).some(Boolean) ? address : null,
      };

      if (isEditing && cellId) {
        await updateCell.mutateAsync({ cellId, updates: cellData });
      } else {
        await createCell.mutateAsync(cellData);
      }

      onSuccess();
    },
    defaultValues: {
      name: "",
      leader_id: "",
      supervisor_id: "",
      parent_id: parentCellId || "",
      meeting_day: undefined,
      meeting_time: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (cell && isEditing) {
      formContext.reset({
        name: cell.name,
        leader_id: cell.leader_id,
        supervisor_id: cell.supervisor_id || "",
        parent_id: cell.parent_id || "",
        meeting_day: cell.meeting_day,
        meeting_time: cell.meeting_time || "",
        street: cell.address?.street || "",
        number: cell.address?.number || "",
        complement: cell.address?.complement || "",
        neighborhood: cell.address?.neighborhood || "",
        city: cell.address?.city || "",
        state: cell.address?.state || "",
        zipCode: cell.address?.zipCode || "",
      });
    }
  }, [cell, isEditing, formContext]);

  const users = usersData || [];
  const cells = cellsData?.data || [];

  // Filter users that can be leaders (leaders or above)
  const leaderOptions = users
    .filter(user => ['leader', 'supervisor', 'pastor'].includes(user.role || ''))
    .map(user => ({
      value: user.id,
      label: user.full_name || user.email,
    }));

  // Filter users that can be supervisors
  const supervisorOptions = users
    .filter(user => ['supervisor', 'pastor'].includes(user.role || ''))
    .map(user => ({
      value: user.id,
      label: user.full_name || user.email,
    }));

  // Filter cells that can be parents (exclude current cell and its descendants)
  const parentCellOptions = cells
    .filter(c => c.id !== cellId) // Can't be parent of itself
    .map(c => ({
      value: c.id,
      label: c.name,
    }));

  const dayOptions = [
    { value: 0, label: t("days.sunday") },
    { value: 1, label: t("days.monday") },
    { value: 2, label: t("days.tuesday") },
    { value: 3, label: t("days.wednesday") },
    { value: 4, label: t("days.thursday") },
    { value: 5, label: t("days.friday") },
    { value: 6, label: t("days.saturday") },
  ];

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center space-x-3">
          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? t("form.editTitle") : t("form.createTitle")}
          </h2>
        </div>
        
        <Button
          onClick={onCancel}
          variant="outlineDark"
          size="small"
          icon={<X className="h-4 w-4" />}
        >
          {t("form.cancel")}
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={formContext.handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            {t("form.basicInfo")}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="name"
              label={t("form.name")}
              placeholder={t("form.namePlaceholder")}
              icon={<Building className="h-4 w-4" />}
              required
              formContext={formContext}
            />

            <Select
              label={t("form.leader")}
              placeholder={t("form.selectLeader")}
              items={leaderOptions}
              defaultValue={formContext.watch("leader_id")}
              onChange={(value) => formContext.setValue("leader_id", value)}
              icon={<User className="h-4 w-4" />}
              required
            />

            <Select
              label={t("form.supervisor")}
              placeholder={t("form.selectSupervisor")}
              items={supervisorOptions}
              defaultValue={formContext.watch("supervisor_id")}
              onChange={(value) => formContext.setValue("supervisor_id", value)}
              icon={<User className="h-4 w-4" />}
            />

            <Select
              label={t("form.parentCell")}
              placeholder={t("form.selectParentCell")}
              items={parentCellOptions}
              defaultValue={formContext.watch("parent_id")}
              onChange={(value) => formContext.setValue("parent_id", value)}
              icon={<Building className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Meeting Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            {t("form.meetingInfo")}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label={t("form.meetingDay")}
              placeholder={t("form.selectMeetingDay")}
              items={dayOptions}
              defaultValue={formContext.watch("meeting_day")}
              onChange={(value) => formContext.setValue("meeting_day", parseInt(value))}
              icon={<Calendar className="h-4 w-4" />}
            />

            <FormInput
              name="meeting_time"
              label={t("form.meetingTime")}
              type="time"
              placeholder="19:30"
              icon={<Clock className="h-4 w-4" />}
              formContext={formContext}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>{t("form.address")}</span>
          </h3>
          
          <AddressForm formContext={formContext} />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outlineDark"
            onClick={onCancel}
          >
            {t("form.cancel")}
          </Button>
          
          <Button
            type="submit"
            disabled={formContext.isSubmitting}
            icon={<Save className="h-4 w-4" />}
          >
            {formContext.isSubmitting 
              ? t("form.saving") 
              : isEditing 
                ? t("form.update") 
                : t("form.create")
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
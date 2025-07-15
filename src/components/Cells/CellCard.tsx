"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { 
  Users, 
  User, 
  MapPin, 
  Calendar, 
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { useDeleteCell } from "@/hooks/queries/useCells";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CellCardProps {
  cell: {
    id: string;
    name: string;
    meeting_day?: number;
    meeting_time?: string;
    address?: any;
    created_at: string;
    leader?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
    supervisor?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
    parent_cell?: {
      id: string;
      name: string;
    };
    members?: any[];
    child_cells?: any[];
  };
  onEdit?: (cellId: string) => void;
  onAddMember?: (cellId: string) => void;
  className?: string;
}

export function CellCard({ cell, onEdit, onAddMember, className = "" }: CellCardProps) {
  const t = useTranslations("Cells");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const deleteCell = useDeleteCell();

  const getDayName = (day: number) => {
    const days = [
      t("days.sunday"),
      t("days.monday"),
      t("days.tuesday"),
      t("days.wednesday"),
      t("days.thursday"),
      t("days.friday"),
      t("days.saturday")
    ];
    return days[day] || "";
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return time;
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return null;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.neighborhood) parts.push(address.neighborhood);
    if (address.city) parts.push(address.city);
    
    return parts.join(', ');
  };

  const handleDelete = async () => {
    if (window.confirm(t("confirmDelete"))) {
      setIsLoading(true);
      try {
        await deleteCell.mutateAsync(cell.id);
      } catch (error) {
        // Error handling is done in the mutation
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleView = () => {
    router.push(`/app/cells/${cell.id}`);
  };

  const membersCount = cell.members?.length || 0;
  const childCellsCount = cell.child_cells?.length || 0;
  const address = formatAddress(cell.address);

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {cell.name}
          </h3>
          
          {cell.parent_cell && (
            <div className="flex items-center space-x-2 mb-2">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("parentCell")}: {cell.parent_cell.name}
              </span>
            </div>
          )}
        </div>
        
        <Dropdown>
          <DropdownTrigger>
            <Button variant="outlineDark" size="small">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end">
            <button
              onClick={handleView}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Eye className="mr-2 h-4 w-4" />
              {t("actions.view")}
            </button>
            <button
              onClick={() => onEdit?.(cell.id)}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Edit className="mr-2 h-4 w-4" />
              {t("actions.edit")}
            </button>
            <button
              onClick={() => onAddMember?.(cell.id)}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t("actions.addMember")}
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("actions.delete")}
            </button>
          </DropdownContent>
        </Dropdown>
      </div>

      {/* Leader Info */}
      {cell.leader && (
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            {cell.leader.avatar_url ? (
              <img 
                src={cell.leader.avatar_url} 
                alt={cell.leader.full_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {cell.leader.full_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("leader")}
            </p>
          </div>
        </div>
      )}

      {/* Meeting Info */}
      {(cell.meeting_day !== undefined && cell.meeting_time) && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{getDayName(cell.meeting_day)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{formatTime(cell.meeting_time)}</span>
          </div>
        </div>
      )}

      {/* Address */}
      {address && (
        <div className="flex items-start space-x-2 mb-4">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {address}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {membersCount}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {membersCount === 1 ? t("member") : t("members")}
            </span>
          </div>
          
          {childCellsCount > 0 && (
            <div className="flex items-center space-x-1">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {childCellsCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {childCellsCount === 1 ? t("childCell") : t("childCells")}
              </span>
            </div>
          )}
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t("created")} {formatDistanceToNow(new Date(cell.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </span>
      </div>
    </div>
  );
}
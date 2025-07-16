"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  User, 
  UserMinus, 
  Crown, 
  Award,
  MoreVertical,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { useCellMembers, useRemoveCellMember } from "@/hooks/queries/useCells";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CellMembersTableProps {
  cellId: string;
  onAddMember: () => void;
  className?: string;
}

export function CellMembersTable({ cellId, onAddMember, className = "" }: CellMembersTableProps) {
  const t = useTranslations("Cells");
  const { data: members = [], isLoading, refetch } = useCellMembers(cellId);
  const removeMember = useRemoveCellMember();

  const handleRemoveMember = async (profileId: string) => {
    if (window.confirm(t("members.confirmRemove"))) {
      try {
        await removeMember.mutateAsync({ cellId, profileId });
        refetch();
      } catch (error) {
        // Error handling is done in the mutation
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "pastor":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "supervisor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "leader":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "timoteo":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getSuccessLadderLevel = (score: number) => {
    if (score >= 80) return { level: t("members.successLadder.excellent"), color: "text-green-600" };
    if (score >= 60) return { level: t("members.successLadder.good"), color: "text-blue-600" };
    if (score >= 40) return { level: t("members.successLadder.regular"), color: "text-yellow-600" };
    return { level: t("members.successLadder.beginner"), color: "text-gray-600" };
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center space-x-3">
          <User className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("members.title")} ({members.length})
          </h3>
        </div>
        
        <Button
          onClick={onAddMember}
          variant="primary"
          size="small"
          icon={<UserPlus className="h-4 w-4" />}
        >
          {t("members.addMember")}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {members.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("members.noMembers")}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t("members.noMembersDescription")}
            </p>
            <Button
              onClick={onAddMember}
              variant="primary"
              icon={<UserPlus className="h-4 w-4" />}
            >
              {t("members.addFirstMember")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("members.member")}</TableHead>
                <TableHead>{t("members.role")}</TableHead>
                <TableHead>{t("members.joinedAt")}</TableHead>
                <TableHead>{t("members.successLadder")}</TableHead>
                <TableHead>{t("members.timoteo")}</TableHead>
                <TableHead className="w-[100px]">{t("members.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const successLadder = getSuccessLadderLevel(member.success_ladder_score || 0);
                
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          {member.profile?.avatar_url ? (
                            <img 
                              src={member.profile.avatar_url} 
                              alt={member.profile.full_name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {member.profile?.full_name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.profile?.role || "member")}>
                        {t(`roles.${member.profile?.role || "member"}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(member.joined_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Award className={`h-4 w-4 ${successLadder.color}`} />
                          <span className={`text-sm font-medium ${successLadder.color}`}>
                            {member.success_ladder_score || 0}
                          </span>
                        </div>
                        <span className={`text-xs ${successLadder.color}`}>
                          {successLadder.level}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.is_timoteo && (
                        <div className="flex items-center space-x-1">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                            {t("members.timoteo")}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant="outlineDark" size="small">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownContent align="end">
                          <button
                            onClick={() => handleRemoveMember(member.profile_id)}
                            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            {t("members.removeMember")}
                          </button>
                        </DropdownContent>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
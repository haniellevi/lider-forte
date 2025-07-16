"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, MoreVertical, Edit, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteUserModal } from "@/components/Modals/InviteUserModal";
import { useChurchUsers, useUpdateUserRole, useRemoveUserFromChurch } from "@/hooks/queries/useUsers";
import { toast } from "sonner";

type UserRole = "admin" | "leader" | "member";

export function UserManagementTable() {
  const t = useTranslations("UserManagement");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: users = [], isLoading, refetch } = useChurchUsers({
    search: searchTerm,
    role: roleFilter === "all" ? undefined : roleFilter,
    page: currentPage,
    limit: itemsPerPage,
  });

  const updateUserRole = useUpdateUserRole();
  const removeUser = useRemoveUserFromChurch();

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole.mutateAsync({ userId, role: newRole });
      toast.success(t("table.roleUpdated"));
    } catch (error) {
      toast.error(t("table.roleUpdateError"));
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (window.confirm(t("table.confirmRemove"))) {
      try {
        await removeUser.mutateAsync(userId);
        toast.success(t("table.userRemoved"));
        refetch();
      } catch (error) {
        toast.error(t("table.removeError"));
      }
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded dark:bg-gray-700"></div>
          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded dark:bg-gray-700"></div>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 animate-pulse rounded dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com filtros */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <InputGroup
              placeholder={t("table.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              iconPosition="left"
            />
          </div>
          <Select
            label={t("table.filterByRole")}
            placeholder={t("table.filterByRole")}
            items={[
              { value: "all", label: t("table.allRoles") },
              { value: "admin", label: t("roles.admin") },
              { value: "leader", label: t("roles.leader") },
              { value: "member", label: t("roles.member") }
            ]}
            defaultValue={roleFilter}
            onChange={(value) => setRoleFilter(value as UserRole | "all")}
          />
        </div>
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          variant="default"
          icon={<UserPlus className="h-4 w-4" />}
        >
          {t("table.inviteUser")}
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.user")}</TableHead>
              <TableHead>{t("table.role")}</TableHead>
              <TableHead>{t("table.joinedAt")}</TableHead>
              <TableHead>{t("table.lastActive")}</TableHead>
              <TableHead className="w-[100px]">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                      {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{user.full_name || user.email}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {t(`roles.${user.role}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.joined_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.last_active ? new Date(user.last_active).toLocaleDateString() : t("table.never")}
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
                        onClick={() => handleRoleChange(user.id, "admin")}
                        disabled={user.role === "admin"}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("table.makeAdmin")}
                      </button>
                      <button
                        onClick={() => handleRoleChange(user.id, "leader")}
                        disabled={user.role === "leader"}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("table.makeLeader")}
                      </button>
                      <button
                        onClick={() => handleRoleChange(user.id, "member")}
                        disabled={user.role === "member"}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t("table.makeMember")}
                      </button>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("table.removeUser")}
                      </button>
                    </DropdownContent>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {t("table.showing")} {((currentPage - 1) * itemsPerPage) + 1} {t("table.to")} {Math.min(currentPage * itemsPerPage, filteredUsers.length)} {t("table.of")} {filteredUsers.length} {t("table.results")}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outlineDark"
              size="small"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              {t("table.previous")}
            </Button>
            <Button
              variant="outlineDark"
              size="small"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              {t("table.next")}
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Convite */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          setIsInviteModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
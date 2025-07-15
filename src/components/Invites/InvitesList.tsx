"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Filter, Search } from "lucide-react";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
import { InviteCard } from "./InviteCard";
import { useChurchInvites } from "@/hooks/queries/useInvites";

type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

interface InvitesListProps {
  title?: string;
  showFilters?: boolean;
}

export function InvitesList({ title, showFilters = true }: InvitesListProps) {
  const t = useTranslations("Invites");
  const [statusFilter, setStatusFilter] = useState<InviteStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invites = [], isLoading, refetch } = useChurchInvites({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const filteredInvites = invites.filter(invite => {
    const matchesSearch = invite.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showFilters && (
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded dark:bg-gray-700"></div>
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded dark:bg-gray-700"></div>
          </div>
        )}
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {title && (
        <div className="flex items-center space-x-3">
          <Mail className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm px-2 py-1 rounded-full">
            {filteredInvites.length}
          </span>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <InputGroup
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                iconPosition="left"
              />
            </div>
            <Select
              label={t("filterByStatus")}
              placeholder={t("filterByStatus")}
              items={[
                { value: "all", label: t("allStatuses") },
                { value: "pending", label: t("status.pending") },
                { value: "accepted", label: t("status.accepted") },
                { value: "rejected", label: t("status.rejected") },
                { value: "expired", label: t("status.expired") }
              ]}
              defaultValue={statusFilter}
              onChange={(value) => setStatusFilter(value as InviteStatus | "all")}
              icon={<Filter className="h-4 w-4" />}
            />
          </div>
        </div>
      )}

      {/* Invites Grid */}
      {filteredInvites.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== "all" 
              ? t("noInvitesFound") 
              : t("noInvites")
            }
          </h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all" 
              ? t("tryDifferentFilter") 
              : t("noInvitesDescription")
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInvites.map((invite) => (
            <InviteCard
              key={invite.id}
              invite={invite}
              isOwner={true}
              onAction={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
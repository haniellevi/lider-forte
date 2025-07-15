"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

interface InviteStatusBadgeProps {
  status: InviteStatus;
  className?: string;
}

export function InviteStatusBadge({ status, className }: InviteStatusBadgeProps) {
  const t = useTranslations("Invites");

  const getStatusColor = (status: InviteStatus) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case 'accepted':
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case 'rejected':
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case 'expired':
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} ${className}`}>
      {t(`status.${status}`)}
    </Badge>
  );
}
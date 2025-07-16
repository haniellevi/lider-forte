"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Mail, 
  User, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  MoreVertical,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { InviteStatusBadge } from "./InviteStatusBadge";
import { 
  useAcceptInvite, 
  useRejectInvite, 
  useCancelInvite, 
  useResendInvite 
} from "@/hooks/queries/useInvites";
import { toast } from "sonner";

type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
type UserRole = 'admin' | 'leader' | 'member';

interface InviteCardProps {
  invite: {
    id: string;
    email: string;
    role: UserRole;
    status: InviteStatus;
    message?: string;
    created_at: string;
    expires_at: string;
    church?: {
      id: string;
      name: string;
    };
    invited_by_user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  isOwner?: boolean;
  onAction?: () => void;
}

export function InviteCard({ invite, isOwner = false, onAction }: InviteCardProps) {
  const t = useTranslations("Invites");
  const [isLoading, setIsLoading] = useState(false);

  const acceptInvite = useAcceptInvite();
  const rejectInvite = useRejectInvite();
  const cancelInvite = useCancelInvite();
  const resendInvite = useResendInvite();

  const isExpired = new Date(invite.expires_at) < new Date();
  const canAccept = invite.status === 'pending' && !isExpired && !isOwner;
  const canReject = invite.status === 'pending' && !isExpired && !isOwner;
  const canCancel = invite.status === 'pending' && isOwner;
  const canResend = (invite.status === 'pending' || invite.status === 'expired') && isOwner;

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

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await acceptInvite.mutateAsync(invite.id);
      onAction?.();
    } catch (error) {
      // Error is handled in the mutation
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectInvite.mutateAsync(invite.id);
      onAction?.();
    } catch (error) {
      // Error is handled in the mutation
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (window.confirm(t("confirmCancel"))) {
      setIsLoading(true);
      try {
        await cancelInvite.mutateAsync(invite.id);
        onAction?.();
      } catch (error) {
        // Error is handled in the mutation
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await resendInvite.mutateAsync(invite.id);
      onAction?.();
    } catch (error) {
      // Error is handled in the mutation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Mail className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {invite.email}
            </h3>
            <p className="text-sm text-gray-500">
              {isOwner ? t("sentBy", { name: "Você" }) : t("sentBy", { name: invite.invited_by_user?.name || "Alguém" })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <InviteStatusBadge status={isExpired ? 'expired' : invite.status} />
          {isOwner && canCancel && (
            <Dropdown>
              <DropdownTrigger>
                <Button variant="outlineDark" size="small">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownContent align="end">
                {canResend && (
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("resend")}
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("cancel")}
                </button>
              </DropdownContent>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t("role")}:</span>
            <Badge className={getRoleBadgeColor(invite.role)}>
              {t(`roles.${invite.role}`)}
            </Badge>
          </div>
        </div>

        {invite.church && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t("church")}:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {invite.church.name}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{t("sentAt", { date: new Date(invite.created_at).toLocaleDateString() })}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className={isExpired ? "text-red-500" : ""}>
              {t("expiresAt", { date: new Date(invite.expires_at).toLocaleDateString() })}
            </span>
          </div>
        </div>

        {invite.message && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              &ldquo;{invite.message}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(canAccept || canReject) && (
        <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {canReject && (
            <Button
              onClick={handleReject}
              disabled={isLoading}
              variant="outlineDark"
              size="small"
              icon={<X className="h-4 w-4" />}
              className="flex-1"
            >
              {t("reject")}
            </Button>
          )}
          {canAccept && (
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              variant="primary"
              size="small"
              icon={<Check className="h-4 w-4" />}
              className="flex-1"
            >
              {t("accept")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
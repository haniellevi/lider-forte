"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { 
  Building, 
  User, 
  Users, 
  MapPin, 
  Calendar, 
  Clock,
  Edit,
  ArrowLeft,
  UserPlus,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { CellForm, CellMembersTable, AddMemberModal } from "@/components/Cells";
import { useCell, useCellMembers } from "@/hooks/queries/useCells";

interface CellDetailContentProps {
  cellId: string;
}

export function CellDetailContent({ cellId }: CellDetailContentProps) {
  const t = useTranslations("Cells");
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'meetings'>('overview');

  const { data: cell, isLoading } = useCell(cellId);
  const { data: members = [] } = useCellMembers(cellId);

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
    if (address.number) parts.push(address.number);
    if (address.neighborhood) parts.push(address.neighborhood);
    if (address.city) parts.push(address.city);
    
    return parts.join(', ');
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  const handleAddMemberSuccess = () => {
    setShowAddMemberModal(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!cell) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t("detail.cellNotFound")}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {t("detail.cellNotFoundDescription")}
        </p>
        <Button
          onClick={() => router.push('/app/cells')}
          variant="primary"
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          {t("detail.backToCells")}
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <CellForm
        cellId={cellId}
        onSuccess={handleEditSuccess}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const existingMemberIds = members.map(member => member.profile_id);
  const address = formatAddress(cell.address);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Button
              onClick={() => router.push('/app/cells')}
              variant="outlineDark"
              size="small"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              {t("detail.backToCells")}
            </Button>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {cell.name}
          </h1>
          
          {cell.parent_cell && (
            <p className="text-gray-500 dark:text-gray-400">
              {t("detail.parentCell")}: {cell.parent_cell.name}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => setShowAddMemberModal(true)}
            variant="outlineDark"
            icon={<UserPlus className="h-4 w-4" />}
          >
            {t("detail.addMember")}
          </Button>
          <Button
            onClick={() => setIsEditing(true)}
            variant="primary"
            icon={<Edit className="h-4 w-4" />}
          >
            {t("detail.editCell")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t("detail.tabs.overview")}
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t("detail.tabs.members")} ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'meetings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {t("detail.tabs.meetings")}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Leader and Supervisor */}
            <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t("detail.leadership")}
              </h3>
              
              <div className="space-y-4">
                {cell.leader && (
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      {cell.leader.avatar_url ? (
                        <img 
                          src={cell.leader.avatar_url} 
                          alt={cell.leader.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {cell.leader.full_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("detail.leader")}
                      </p>
                    </div>
                  </div>
                )}
                
                {cell.supervisor && (
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      {cell.supervisor.avatar_url ? (
                        <img 
                          src={cell.supervisor.avatar_url} 
                          alt={cell.supervisor.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {cell.supervisor.full_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("detail.supervisor")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Info */}
            {(cell.meeting_day !== null && cell.meeting_day !== undefined && cell.meeting_time) && (
              <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t("detail.meetingInfo")}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {cell.meeting_day !== null ? getDayName(cell.meeting_day) : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {formatTime(cell.meeting_time)}
                    </span>
                  </div>
                  {address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <span className="text-gray-900 dark:text-white">
                        {address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t("detail.statistics")}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("detail.totalMembers")}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {members.length}
                  </span>
                </div>
                
                {cell.child_cells && cell.child_cells.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t("detail.childCells")}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {cell.child_cells.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Child Cells */}
            {cell.child_cells && cell.child_cells.length > 0 && (
              <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t("detail.childCells")}
                </h3>
                
                <div className="space-y-2">
                  {cell.child_cells.map((childCell) => (
                    <button
                      key={childCell.id}
                      onClick={() => router.push(`/app/cells/${childCell.id}`)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {childCell.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <CellMembersTable
          cellId={cellId}
          onAddMember={() => setShowAddMemberModal(true)}
        />
      )}

      {activeTab === 'meetings' && (
        <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
          <div className="text-center py-8">
            <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("detail.meetings.comingSoon")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t("detail.meetings.comingSoonDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        cellId={cellId}
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSuccess={handleAddMemberSuccess}
        existingMemberIds={existingMemberIds}
      />
    </div>
  );
}
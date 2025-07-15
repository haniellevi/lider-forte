"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { 
  Building, 
  Search, 
  Filter, 
  Grid, 
  List,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
import { CellCard, CellsTree, CellForm } from "@/components/Cells";
import { useCells } from "@/hooks/queries/useCells";
import { useChurchUsers } from "@/hooks/queries/useUsers";

type ViewMode = 'grid' | 'tree';

export function CellsContent() {
  const t = useTranslations("Cells");
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchTerm, setSearchTerm] = useState("");
  const [leaderFilter, setLeaderFilter] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCellId, setSelectedCellId] = useState<string>("");
  const [editingCellId, setEditingCellId] = useState<string>("");
  const [parentCellId, setParentCellId] = useState<string>("");

  const { data: cellsData, isLoading } = useCells({
    search: searchTerm,
    leader_id: leaderFilter || undefined,
    supervisor_id: supervisorFilter || undefined,
  });

  const { data: users = [] } = useChurchUsers({});

  const cells = cellsData?.data || [];

  // Filter options for leaders and supervisors
  const leaderOptions = users
    .filter(user => ['leader', 'supervisor', 'pastor'].includes(user.role || ''))
    .map(user => ({
      value: user.id,
      label: user.full_name || user.id,
    }));

  const supervisorOptions = users
    .filter(user => ['supervisor', 'pastor'].includes(user.role || ''))
    .map(user => ({
      value: user.id,
      label: user.full_name || user.id,
    }));

  const handleCreateCell = () => {
    setParentCellId("");
    setEditingCellId("");
    setShowCreateForm(true);
  };

  const handleCreateSubCell = (parentId: string) => {
    setParentCellId(parentId);
    setEditingCellId("");
    setShowCreateForm(true);
  };

  const handleEditCell = (cellId: string) => {
    setEditingCellId(cellId);
    setParentCellId("");
    setShowCreateForm(true);
  };

  const handleViewCell = (cellId: string) => {
    router.push(`/app/cells/${cellId}`);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingCellId("");
    setParentCellId("");
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingCellId("");
    setParentCellId("");
  };

  if (showCreateForm) {
    return (
      <CellForm
        cellId={editingCellId}
        parentCellId={parentCellId}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('tree')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-boxdark text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title={t("viewMode.tree")}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-boxdark text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title={t("viewMode.grid")}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={handleCreateCell}
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
          >
            {t("actions.createCell")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <InputGroup
              label=""
              type="text"
              placeholder={t("filters.searchPlaceholder")}
              value={searchTerm}
              handleChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              iconPosition="left"
            />
          </div>
          
          <Select
            label={t("filters.leader")}
            placeholder={t("filters.selectLeader")}
            items={[
              { value: "", label: t("filters.allLeaders") },
              ...leaderOptions
            ]}
            defaultValue={leaderFilter}
          />
          
          <Select
            label={t("filters.supervisor")}
            placeholder={t("filters.selectSupervisor")}
            items={[
              { value: "", label: t("filters.allSupervisors") },
              ...supervisorOptions
            ]}
            defaultValue={supervisorFilter}
          />
        </div>
      </div>

      {/* Content */}
      {viewMode === 'tree' ? (
        <CellsTree
          onSelectCell={handleViewCell}
          onCreateCell={handleCreateCell}
          onCreateSubCell={handleCreateSubCell}
          selectedCellId={selectedCellId}
        />
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
              ))}
            </div>
          ) : cells.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || leaderFilter || supervisorFilter ? t("noResultsFound") : t("noCells")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || leaderFilter || supervisorFilter 
                  ? t("tryDifferentFilters") 
                  : t("noCellsDescription")
                }
              </p>
              {!searchTerm && !leaderFilter && !supervisorFilter && (
                <Button
                  onClick={handleCreateCell}
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                >
                  {t("actions.createFirstCell")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cells.map((cell) => (
                <CellCard
                  key={cell.id}
                  cell={{
                    ...cell,
                    meeting_day: cell.meeting_day ?? undefined,
                    meeting_time: cell.meeting_time ?? undefined,
                  }}
                  onEdit={handleEditCell}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
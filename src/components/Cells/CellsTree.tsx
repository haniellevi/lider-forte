"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  User, 
  Plus,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCells } from "@/hooks/queries/useCells";

interface CellNode {
  id: string;
  name: string;
  leader?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  members?: any[];
  child_cells?: CellNode[];
  parent_id?: string;
}

interface CellTreeNodeProps {
  cell: CellNode;
  level: number;
  onSelectCell: (cellId: string) => void;
  onCreateSubCell: (parentId: string) => void;
  selectedCellId?: string;
}

function CellTreeNode({ 
  cell, 
  level, 
  onSelectCell, 
  onCreateSubCell, 
  selectedCellId 
}: CellTreeNodeProps) {
  const t = useTranslations("Cells");
  const [isExpanded, setIsExpanded] = useState(level < 2); // Expand first 2 levels by default
  
  const hasChildren = cell.child_cells && cell.child_cells.length > 0;
  const membersCount = cell.members?.length || 0;
  const isSelected = selectedCellId === cell.id;

  const indentationStyle = {
    paddingLeft: `${level * 20}px`
  };

  return (
    <div className="border-l border-gray-200 dark:border-gray-700 ml-4">
      <div 
        className={`
          flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''}
        `}
        style={indentationStyle}
        onClick={() => onSelectCell(cell.id)}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </button>

        {/* Cell Icon */}
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded">
          <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Cell Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {cell.name}
            </h4>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              {membersCount} {membersCount === 1 ? t("member") : t("members")}
            </span>
          </div>
          
          {cell.leader && (
            <div className="flex items-center space-x-2 mt-1">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {cell.leader.full_name}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onCreateSubCell(cell.id);
          }}
          variant="outlineDark"
          size="small"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title={t("actions.createSubCell")}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Child Cells */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {cell.child_cells!.map((childCell) => (
            <CellTreeNode
              key={childCell.id}
              cell={childCell}
              level={level + 1}
              onSelectCell={onSelectCell}
              onCreateSubCell={onCreateSubCell}
              selectedCellId={selectedCellId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CellsTreeProps {
  onSelectCell: (cellId: string) => void;
  onCreateCell: () => void;
  onCreateSubCell: (parentId: string) => void;
  selectedCellId?: string;
  className?: string;
}

export function CellsTree({ 
  onSelectCell, 
  onCreateCell, 
  onCreateSubCell, 
  selectedCellId,
  className = "" 
}: CellsTreeProps) {
  const t = useTranslations("Cells");
  const { data: cellsData, isLoading } = useCells();

  // Build tree structure from flat cells data
  const buildTree = (cells: any[]): CellNode[] => {
    const cellMap = new Map<string, CellNode>();
    const rootCells: CellNode[] = [];

    // First pass: create all nodes
    cells.forEach(cell => {
      cellMap.set(cell.id, {
        ...cell,
        child_cells: []
      });
    });

    // Second pass: build tree structure
    cells.forEach(cell => {
      const cellNode = cellMap.get(cell.id)!;
      
      if (cell.parent_id) {
        const parent = cellMap.get(cell.parent_id);
        if (parent) {
          parent.child_cells!.push(cellNode);
        } else {
          // Parent not found, treat as root
          rootCells.push(cellNode);
        }
      } else {
        rootCells.push(cellNode);
      }
    });

    return rootCells;
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cells = cellsData?.data || [];
  const rootCells = buildTree(cells);

  return (
    <div className={`bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center space-x-3">
          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("hierarchy.title")}
          </h3>
        </div>
        
        <Button
          onClick={onCreateCell}
          variant="default"
          size="small"
          icon={<Plus className="h-4 w-4" />}
        >
          {t("actions.createCell")}
        </Button>
      </div>

      {/* Tree Content */}
      <div className="p-6">
        {rootCells.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("hierarchy.noCells")}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t("hierarchy.noCellsDescription")}
            </p>
            <Button
              onClick={onCreateCell}
              variant="default"
              icon={<Plus className="h-4 w-4" />}
            >
              {t("actions.createFirstCell")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 group">
            {rootCells.map((cell) => (
              <CellTreeNode
                key={cell.id}
                cell={cell}
                level={0}
                onSelectCell={onSelectCell}
                onCreateSubCell={onCreateSubCell}
                selectedCellId={selectedCellId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, FileText, Zap } from 'lucide-react';
import { DashboardOverview } from '@/components/Reports/DashboardOverview';
import { ReportsList } from './ReportsList';
import { CreateReportModal } from './CreateReportModal';
import { GenerateReportModal } from './GenerateReportModal';

type ActiveTab = 'dashboard' | 'reports' | 'generate';

export function ReportsContent() {
  const t = useTranslations('Reports');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const tabs = [
    {
      id: 'dashboard' as const,
      name: t('dashboard.title'),
      icon: BarChart3,
      description: t('dashboard.overview'),
    },
    {
      id: 'reports' as const,
      name: t('list.title'),
      icon: FileText,
      description: t('list.subtitle'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowGenerateModal(true)}
            variant="outlineDark"
            icon={<Zap className="h-4 w-4" />}
          >
            {t('generate.title')}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            icon={<Plus className="h-4 w-4" />}
          >
            {t('actions.create')}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'reports' && <ReportsList />}
      </div>

      {/* Modals */}
      <CreateReportModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  );
}
"use client";

import { useTranslations } from "next-intl";
import { 
  Building, 
  Users, 
  Mail, 
  TrendingUp 
} from "lucide-react";
import { 
  StatsCard, 
  GrowthChart, 
  RecentActivity, 
  QuickActions, 
  PendingInvites 
} from "@/components/Dashboard";
import { useDashboardData } from "@/hooks/queries/useDashboard";

export function DashboardContent() {
  const t = useTranslations("Dashboard");
  const { data: dashboardData, isLoading } = useDashboardData();

  const statsCards = [
    {
      title: t("stats.totalChurches"),
      value: dashboardData?.stats.totalChurches || 0,
      icon: <Building className="h-5 w-5" />,
      color: 'blue' as const,
      trend: dashboardData?.stats.monthlyGrowth.churches ? {
        value: dashboardData.stats.monthlyGrowth.churches,
        isPositive: dashboardData.stats.monthlyGrowth.churches >= 0,
        label: t("stats.thisMonth")
      } : undefined,
    },
    {
      title: t("stats.totalUsers"),
      value: dashboardData?.stats.totalUsers || 0,
      icon: <Users className="h-5 w-5" />,
      color: 'green' as const,
      trend: dashboardData?.stats.monthlyGrowth.users ? {
        value: dashboardData.stats.monthlyGrowth.users,
        isPositive: dashboardData.stats.monthlyGrowth.users >= 0,
        label: t("stats.thisMonth")
      } : undefined,
    },
    {
      title: t("stats.totalCells"),
      value: dashboardData?.stats.totalCells || 0,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'purple' as const,
      trend: dashboardData?.stats.monthlyGrowth.cells ? {
        value: dashboardData.stats.monthlyGrowth.cells,
        isPositive: dashboardData.stats.monthlyGrowth.cells >= 0,
        label: t("stats.thisMonth")
      } : undefined,
    },
    {
      title: t("stats.pendingInvites"),
      value: dashboardData?.stats.pendingInvites || 0,
      icon: <Mail className="h-5 w-5" />,
      color: 'orange' as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>

        {/* Loading Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="animate-pulse bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t("welcome")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <StatsCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            trend={card.trend}
          />
        ))}
      </div>

      {/* Charts and Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <GrowthChart />
        </div>
        
        {/* Quick Actions - Takes 1 column */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Activity and Pending Invites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <PendingInvites />
      </div>
    </div>
  );
}
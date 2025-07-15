"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, Users, Building } from "lucide-react";
import dynamic from "next/dynamic";
import { useMonthlyGrowthChart } from "@/hooks/queries/useDashboard";

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function GrowthChart() {
  const t = useTranslations("Dashboard");
  const { data: chartData, isLoading } = useMonthlyGrowthChart();

  const chartOptions = useMemo(() => ({
    chart: {
      type: 'area' as const,
      height: 350,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: 'transparent',
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3,
    },
    colors: ['#3B82F6', '#10B981'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: chartData?.map(item => item.month) || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px',
        },
      },
    },
    legend: {
      position: 'top' as const,
      horizontalAlign: 'right' as const,
      fontSize: '12px',
      fontWeight: '500',
      labels: {
        colors: '#6B7280',
      },
      markers: {
        width: 8,
        height: 8,
        radius: 4,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => `${value} ${value === 1 ? 'novo' : 'novos'}`,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'bottom' as const,
            horizontalAlign: 'center' as const,
          },
        },
      },
    ],
  }), [chartData]);

  const series = useMemo(() => [
    {
      name: t("chart.users"),
      data: chartData?.map(item => item.users) || [],
    },
    {
      name: t("chart.cells"),
      data: chartData?.map(item => item.cells) || [],
    },
  ], [chartData, t]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const totalGrowth = chartData?.reduce((acc, item) => acc + item.users + item.cells, 0) || 0;
  const hasGrowth = totalGrowth > 0;

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("growthChart.title")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("growthChart.subtitle")}
            </p>
          </div>
        </div>
        
        {hasGrowth && (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">
              +{totalGrowth} {t("growthChart.totalGrowth")}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData && chartData.length > 0 ? (
        <div className="h-80">
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="area"
            height="100%"
            width="100%"
          />
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("growthChart.noData")}
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              {t("growthChart.noDataDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("growthChart.newUsers")}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              +{chartData?.reduce((acc, item) => acc + item.users, 0) || 0}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
            <Building className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("growthChart.newCells")}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              +{chartData?.reduce((acc, item) => acc + item.cells, 0) || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
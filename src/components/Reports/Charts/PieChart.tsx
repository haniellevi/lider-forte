"use client";

import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  formatTooltip?: (value: any, name: string) => [string, string];
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
];

export function PieChart({ 
  data, 
  height = 300,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  formatTooltip,
  colors = DEFAULT_COLORS
}: PieChartProps) {
  // Garantir que cada item tenha uma cor
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={dataWithColors}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {dataWithColors.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--foreground)',
          }}
          formatter={formatTooltip}
        />
        {showLegend && (
          <Legend 
            wrapperStyle={{
              paddingTop: '20px',
            }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
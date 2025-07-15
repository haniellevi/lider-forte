"use client";

import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface LineChartProps {
  data: Array<Record<string, any>>;
  xAxisKey: string;
  lines: Array<{
    dataKey: string;
    color: string;
    name: string;
    strokeWidth?: number;
  }>;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatTooltip?: (value: any, name: string) => [string, string];
}

export function LineChart({ 
  data, 
  xAxisKey, 
  lines, 
  height = 300,
  showGrid = true,
  showLegend = true,
  formatTooltip
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />}
        <XAxis 
          dataKey={xAxisKey} 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--foreground)',
          }}
          formatter={formatTooltip}
        />
        {showLegend && <Legend />}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            name={line.name}
            dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: line.color, strokeWidth: 2 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
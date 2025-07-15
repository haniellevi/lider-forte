"use client";

import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BarChartProps {
  data: Array<Record<string, any>>;
  xAxisKey: string;
  bars: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatTooltip?: (value: any, name: string) => [string, string];
  layout?: 'horizontal' | 'vertical';
}

export function BarChart({ 
  data, 
  xAxisKey, 
  bars, 
  height = 300,
  showGrid = true,
  showLegend = true,
  formatTooltip,
  layout = 'vertical'
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart 
        data={data} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        layout={layout}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />}
        <XAxis 
          dataKey={xAxisKey} 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
          type={layout === 'horizontal' ? 'category' : 'number'}
        />
        <YAxis 
          className="text-gray-600 dark:text-gray-400"
          tick={{ fontSize: 12 }}
          type={layout === 'horizontal' ? 'number' : 'category'}
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
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.color}
            name={bar.name}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
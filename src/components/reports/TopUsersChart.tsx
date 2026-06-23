import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChartColors } from '../../hooks/useChartColors';
import { chartAxisTick, chartTooltipStyle } from './chartStyles';

export interface TopUserEntry {
  actorEmail: string;
  eventCount: number;
}

export interface TopUsersChartProps {
  data?: TopUserEntry[];
  loading?: boolean;
}

export const TopUsersChart: React.FC<TopUsersChartProps> = ({ data, loading }) => {
  const { t } = useTranslation('reports');
  const colors = useChartColors();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs font-medium">{t('charts.loading')}</span>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground/50">
        <span className="text-xs font-medium">{t('charts.emptyUsers')}</span>
      </div>
    );
  }

  const chartData = data.slice(0, 10).map((u) => ({
    email: u.actorEmail.length > 24 ? `${u.actorEmail.slice(0, 22)}…` : u.actorEmail,
    eventCount: u.eventCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
        <XAxis
          type="number"
          tick={chartAxisTick(colors)}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="email"
          tick={{ fontSize: 10, fill: colors.muted, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={148}
        />
        <Tooltip contentStyle={chartTooltipStyle(colors)} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
        <Bar
          dataKey="eventCount"
          name={t('charts.eventCountLabel')}
          fill={colors.violet}
          radius={[0, 6, 6, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

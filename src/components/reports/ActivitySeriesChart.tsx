import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ActivitySeriesResult } from '../../services/adminService';
import { useChartColors, withAlpha } from '../../hooks/useChartColors';
import { chartAxisTick, chartLegendStyle, chartTooltipStyle } from './chartStyles';

export interface ActivitySeriesChartProps {
  data?: ActivitySeriesResult;
  loading?: boolean;
}

export const ActivitySeriesChart: React.FC<ActivitySeriesChartProps> = ({ data, loading }) => {
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

  if (!data?.series?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground/50">
        <span className="text-xs font-medium">{t('charts.emptyActivity')}</span>
      </div>
    );
  }

  const series = data.series.map((pt) => ({
    ...pt,
    label: new Date(pt.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const auditStroke = colors.primary;
  const docsStroke = colors.info;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gradAudit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={auditStroke} stopOpacity={0.45} />
            <stop offset="95%" stopColor={auditStroke} stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="gradDocs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={docsStroke} stopOpacity={0.45} />
            <stop offset="95%" stopColor={docsStroke} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey="label" tick={chartAxisTick(colors)} axisLine={false} tickLine={false} />
        <YAxis
          tick={chartAxisTick(colors)}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={chartTooltipStyle(colors)} />
        <Legend wrapperStyle={chartLegendStyle(colors)} />
        <Area
          type="monotone"
          dataKey="auditEvents"
          name={t('charts.auditEventsLabel')}
          stroke={auditStroke}
          strokeWidth={2.5}
          fill="url(#gradAudit)"
          activeDot={{ r: 5, fill: auditStroke, stroke: withAlpha(colors.background, 0.9), strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="documentUploads"
          name={t('charts.documentUploadsLabel')}
          stroke={docsStroke}
          strokeWidth={2.5}
          fill="url(#gradDocs)"
          activeDot={{ r: 5, fill: docsStroke, stroke: withAlpha(colors.background, 0.9), strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

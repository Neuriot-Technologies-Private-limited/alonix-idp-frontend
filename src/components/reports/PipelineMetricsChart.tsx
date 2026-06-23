import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PipelineMetrics } from '../../services/adminService';
import { useChartColors } from '../../hooks/useChartColors';
import { chartAxisTick, chartLegendStyle, chartTooltipStyle } from './chartStyles';

export interface PipelineMetricsChartProps {
  data?: PipelineMetrics;
  loading?: boolean;
}

export const PipelineMetricsChart: React.FC<PipelineMetricsChartProps> = ({ data, loading }) => {
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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground/50">
        <span className="text-xs font-medium">{t('charts.emptyPipeline')}</span>
      </div>
    );
  }

  const extractFailed = Math.max(0, data.failedDocuments - data.ingestFailed);

  const chartData = [
    {
      stage: t('charts.pipelineStages.ingest'),
      success: data.ingestCompleted,
      failed: data.ingestFailed,
    },
    {
      stage: t('charts.pipelineStages.extract'),
      success: data.extractCompleted,
      failed: extractFailed,
    },
    {
      stage: t('charts.pipelineStages.classify'),
      success: data.classifyCompleted,
      failed: Math.max(0, data.failedDocuments - data.ingestFailed - extractFailed),
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey="stage" tick={chartAxisTick(colors)} axisLine={false} tickLine={false} />
        <YAxis
          tick={chartAxisTick(colors)}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={chartTooltipStyle(colors)} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
        <Legend wrapperStyle={chartLegendStyle(colors)} />
        <Bar
          dataKey="success"
          name={t('charts.successLabel')}
          fill={colors.success}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
        <Bar
          dataKey="failed"
          name={t('charts.failedLabel')}
          fill={colors.destructive}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

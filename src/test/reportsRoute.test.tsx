import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoleProtectedRoute } from '../components/auth/RoleProtectedRoute';
import { ReportsPage } from '../pages/reports/ReportsPage';

vi.mock('../hooks/useRbac');
vi.mock('../components/reports/ReportExportMenu', () => ({
  ReportExportMenu: () => <div data-testid="report-export-menu">Export Menu</div>,
}));
vi.mock('../components/reports/ActivitySeriesChart', () => ({
  ActivitySeriesChart: () => <div data-testid="activity-series-chart" />,
}));
vi.mock('../components/reports/PipelineMetricsChart', () => ({
  PipelineMetricsChart: () => <div data-testid="pipeline-metrics-chart" />,
}));
vi.mock('../components/reports/TopUsersChart', () => ({
  TopUsersChart: () => <div data-testid="top-users-chart" />,
}));
vi.mock('../hooks/useOrgQuota', () => ({
  useOrgQuota: () => ({
    saasBilling: false,
    isLoading: false,
    isError: false,
    raw: undefined,
    quota: null,
    atCap: () => false,
    capMessage: () => '',
    blocksUsage: false,
  }),
}));

vi.mock('../hooks/queries/admin', () => ({
  useActivitySeries: () => ({ data: { series: [{ period: '2025-01-01', auditEvents: 5, documentUploads: 3 }], from: '', to: '', granularity: 'day' }, isLoading: false }),
  useUsageSummary: () => ({ data: { documentUploads: 42, storageBytesAdded: 1048576, auditEvents: 120, activeUsers: 7 }, isLoading: false }),
  usePipelineMetrics: () => ({ data: { totalDocuments: 100, ingestCompleted: 90, ingestFailed: 5, extractCompleted: 85, classifyCompleted: 80, failedDocuments: 10, successRatePercent: 90, jobsProcessing: 2, pipelineBusy: 1 }, isLoading: false }),
  useMetricsByUser: () => ({ data: { users: [{ actorEmail: 'test@example.com', eventCount: 15 }], from: '', to: '' }, isLoading: false }),
}));

import { useRbac } from '../hooks/useRbac';
import type { AuthContextPayload } from '../types/auth';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'page.title': 'Reports & Analytics',
        'page.subtitle': 'Monitor usage, pipeline health, and workspace activity across your organization.',
        'page.badge': 'Reports & Insights',
        'page.backToDashboard': 'Back to Dashboard',
        'page.viewFullAuditLog': 'View full audit log',
        'dateRangePicker.label': 'Date range',
        'dateRangePicker.presets.7d': '7 days',
        'dateRangePicker.presets.30d': '30 days',
        'dateRangePicker.presets.90d': '90 days',
        'dateRangePicker.presets.month': 'This month',
        'kpi.documentUploads': 'Documents Uploaded',
        'kpi.storageAdded': 'Storage Added',
        'kpi.auditEvents': 'Audit Events',
        'kpi.activeUsers': 'Active Users',
        'pipeline.heading': 'Pipeline Metrics',
        'pipeline.totalDocs': 'Total Documents',
        'pipeline.successRate': 'Success Rate',
        'pipeline.failed': 'Failed Docs',
        'pipeline.ingestDone': 'Ingest Done',
        'pipeline.extractDone': 'Extract Done',
        'pipeline.jobsProcessing': 'Jobs Processing',
        'charts.loading': 'Loading data…',
        'charts.emptyActivity': 'No activity data for this period.',
        'charts.emptyPipeline': 'No pipeline data available.',
        'charts.emptyUsers': 'No user activity data for this period.',
        'charts.activitySeriesTitle': 'Activity Over Time',
        'charts.pipelineTitle': 'Pipeline Success vs Failed',
        'charts.topUsersTitle': 'Most Active Users',
        'charts.auditEventsLabel': 'Audit Events',
        'charts.documentUploadsLabel': 'Document Uploads',
        'charts.successLabel': 'Success',
        'charts.failedLabel': 'Failed',
        'charts.eventCountLabel': 'Events',
        'charts.pipelineStages.ingest': 'Ingest',
        'charts.pipelineStages.extract': 'Extract',
        'charts.pipelineStages.classify': 'Classify',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'en' },
  }),
}));

const mockUseRbac = vi.mocked(useRbac);

const defaultRbac: ReturnType<typeof useRbac> = {
  hasCapability: vi.fn(() => false),
  hasAnyCapability: vi.fn(() => false),
  hasAllCapabilities: vi.fn(() => false),
  orgRole: undefined,
  activeGroupRole: null,
  groups: [] as AuthContextPayload['groups'],
  accessibleGroupIds: [] as string[],
  adminGroupIds: [] as string[] | null,
  hasAnyGroupAdmin: false,
  isGroupAdminFor: vi.fn(() => false),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRbac.mockReturnValue({ ...defaultRbac });
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderReportsRoute(initialPath = '/reports') {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/reports"
            element={<RoleProtectedRoute requiredOrgRole="COMPANY_ADMIN" />}
          >
            <Route index element={<ReportsPage />} />
          </Route>
          <Route path="/forbidden" element={<div>Forbidden Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Reports route', () => {
  it('renders ReportsPage when user is COMPANY_ADMIN', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'COMPANY_ADMIN' });
    renderReportsRoute();
    expect(screen.getAllByText('Reports & Analytics').length).toBeGreaterThanOrEqual(1);
  });

  it('redirects to /forbidden when user is not COMPANY_ADMIN', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'MEMBER' });
    renderReportsRoute();
    expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
  });

  it('shows date range presets', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'COMPANY_ADMIN' });
    renderReportsRoute();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('90 days')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('does NOT show coming soon badge', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'COMPANY_ADMIN' });
    renderReportsRoute();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  it('renders charts section headings', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'COMPANY_ADMIN' });
    renderReportsRoute();
    expect(screen.getByText('Activity Over Time')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Success vs Failed')).toBeInTheDocument();
    expect(screen.getByText('Most Active Users')).toBeInTheDocument();
  });

  it('renders KPI cards with data', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'COMPANY_ADMIN' });
    renderReportsRoute();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders pipeline metrics', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'COMPANY_ADMIN' });
    renderReportsRoute();
    expect(screen.getByText('Pipeline Metrics')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders view full audit log link', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'COMPANY_ADMIN' });
    renderReportsRoute();
    expect(screen.getByText('View full audit log')).toBeInTheDocument();
  });

  it('accepts headerActions prop', () => {
    mockUseRbac.mockReturnValue({ ...defaultRbac, orgRole: 'COMPANY_ADMIN' });
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/reports']}>
          <Routes>
            <Route path="/reports" element={<ReportsPage headerActions={<button>Export</button>} />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Export')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportExportMenu } from '../components/reports/ReportExportMenu';

const mockAlert = vi.fn().mockResolvedValue(undefined);

vi.mock('../components/alert', () => ({
  useAlert: () => ({ alert: mockAlert, confirm: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

const mockExportActivityCsv = vi.fn().mockResolvedValue(new Blob(['csv-data'], { type: 'text/csv' }));
const mockExportActivityPdf = vi.fn().mockResolvedValue(new Blob(['pdf-data'], { type: 'application/pdf' }));
const mockExportActivityExcel = vi.fn().mockResolvedValue(new Blob(['xlsx-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
const mockExportMetricsCsv = vi.fn().mockResolvedValue(new Blob(['csv-data'], { type: 'text/csv' }));
const mockExportMetricsPdf = vi.fn().mockResolvedValue(new Blob(['pdf-data'], { type: 'application/pdf' }));
const mockExportMetricsExcel = vi.fn().mockResolvedValue(new Blob(['xlsx-data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

vi.mock('../services/adminService', () => ({
  adminService: {
    exportActivityCsv: (...args: unknown[]) => mockExportActivityCsv(...args),
    exportActivityPdf: (...args: unknown[]) => mockExportActivityPdf(...args),
    exportActivityExcel: (...args: unknown[]) => mockExportActivityExcel(...args),
    exportMetricsCsv: (...args: unknown[]) => mockExportMetricsCsv(...args),
    exportMetricsPdf: (...args: unknown[]) => mockExportMetricsPdf(...args),
    exportMetricsExcel: (...args: unknown[]) => mockExportMetricsExcel(...args),
  },
  downloadBlob: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderMenu(props = {}) {
  return render(
    <ReportExportMenu from="2024-01-01T00:00:00Z" to="2024-01-31T23:59:59Z" {...props} />
  );
}

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: /export format/i }));
}

describe('ReportExportMenu', () => {
  it('renders the export button', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: /export format/i })).toBeInTheDocument();
  });

  it('shows all six export options when menu is opened', () => {
    renderMenu();
    openMenu();
    expect(screen.getByTestId('export-activity-csv')).toBeInTheDocument();
    expect(screen.getByTestId('export-activity-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('export-activity-excel')).toBeInTheDocument();
    expect(screen.getByTestId('export-metrics-csv')).toBeInTheDocument();
    expect(screen.getByTestId('export-metrics-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('export-metrics-excel')).toBeInTheDocument();
  });

  it('calls exportActivityCsv when activity CSV is clicked', async () => {
    renderMenu({ actorEmail: 'user@test.com', groupId: 'g1' });
    openMenu();
    fireEvent.click(screen.getByTestId('export-activity-csv'));

    await waitFor(() => {
      expect(mockExportActivityCsv).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
          actorEmail: 'user@test.com',
          groupId: 'g1',
        })
      );
    });
  });

  it('calls exportActivityPdf when activity PDF is clicked', async () => {
    renderMenu();
    openMenu();
    fireEvent.click(screen.getByTestId('export-activity-pdf'));

    await waitFor(() => {
      expect(mockExportActivityPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        })
      );
    });
  });

  it('calls exportMetricsExcel when metrics Excel is clicked', async () => {
    renderMenu();
    openMenu();
    fireEvent.click(screen.getByTestId('export-metrics-excel'));

    await waitFor(() => {
      expect(mockExportMetricsExcel).toHaveBeenCalledWith({
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
      });
    });
  });

  it('calls exportMetricsPdf when metrics PDF is clicked', async () => {
    renderMenu();
    openMenu();
    fireEvent.click(screen.getByTestId('export-metrics-pdf'));

    await waitFor(() => {
      expect(mockExportMetricsPdf).toHaveBeenCalledWith({
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
      });
    });
  });

  it('shows error alert on export failure', async () => {
    mockExportMetricsPdf.mockRejectedValueOnce(new Error('Network timeout'));
    renderMenu();
    openMenu();
    fireEvent.click(screen.getByTestId('export-metrics-pdf'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'danger',
          title: 'Export failed',
        })
      );
    });
  });
});

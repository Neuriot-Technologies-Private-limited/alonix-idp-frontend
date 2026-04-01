/**
 * Formats an upload / discovery timestamp for list UIs (local date + time).
 */
export function formatDiscoveryUploadedAt(value: unknown): string {
  if (value == null || value === '') return '—';
  const t = new Date(value as string | number | Date).getTime();
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export type DatePreset = '7d' | '30d' | '90d' | 'month';

export interface DateRange {
  from: string;
  to: string;
}

export function rangeForPreset(preset: DatePreset): DateRange {
  const to = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  else from.setMonth(from.getMonth() - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

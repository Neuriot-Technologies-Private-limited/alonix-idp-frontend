import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';
import { rangeForPreset, type DatePreset, type DateRange } from '../../utils/reportDateRange';

export type { DatePreset, DateRange };

export interface DateRangePickerProps {
  value?: DatePreset;
  onChange: (range: DateRange, preset: DatePreset) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = '30d',
  onChange,
  className,
}) => {
  const { t } = useTranslation('reports');
  const [preset, setPreset] = React.useState<DatePreset>(value);

  React.useEffect(() => {
    setPreset(value);
  }, [value]);

  const handleSelect = (p: DatePreset) => {
    setPreset(p);
    onChange(rangeForPreset(p), p);
  };

  return (
    <section className={cn('flex flex-wrap gap-2 items-center', className)}>
      <div className="flex items-center gap-1.5 mr-2 text-muted-foreground/50">
        <Calendar className="h-3.5 w-3.5" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {t('dateRangePicker.label')}
        </span>
      </div>
      {(['7d', '30d', '90d', 'month'] as DatePreset[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => handleSelect(p)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
            preset === p
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-surface-highest/5 border-border/10 text-muted-foreground hover:text-foreground'
          )}
        >
          {t(`dateRangePicker.presets.${p}`)}
        </button>
      ))}
    </section>
  );
};

import { describe, expect, it } from 'vitest';
import { variantIcon, variantStyles } from '../components/alert/alertVariants';

describe('alertVariants', () => {
  it('maps variants to icon components', () => {
    expect(variantIcon('danger')).toBeDefined();
    expect(variantIcon('success')).toBeDefined();
    expect(variantIcon('info')).toBeDefined();
    expect(variantIcon('danger')).not.toBe(variantIcon('success'));
  });

  it('returns distinct style tokens per variant', () => {
    const danger = variantStyles('danger');
    const success = variantStyles('success');
    expect(danger.primaryBtn).not.toBe(success.primaryBtn);
    expect(danger.iconWrap).toContain('destructive');
    expect(success.iconWrap).toContain('success');
  });

  it('falls back to default styles for unknown variant', () => {
    const styles = variantStyles('default');
    expect(styles.primaryBtn).toContain('bg-primary');
  });
});

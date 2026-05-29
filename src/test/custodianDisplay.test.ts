import { describe, expect, it } from 'vitest';
import { resolveCustodianDisplay } from '../utils/custodianDisplay';

describe('resolveCustodianDisplay', () => {
  const directory = new Map([['jane@example.com', 'Jane Doe']]);

  it('returns Unknown for empty or Unknown uploader', () => {
    expect(resolveCustodianDisplay(undefined, directory)).toEqual({ label: 'Unknown', email: '' });
    expect(resolveCustodianDisplay('Unknown', directory)).toEqual({ label: 'Unknown', email: '' });
  });

  it('uses directory name when email is known', () => {
    expect(resolveCustodianDisplay('jane@example.com', directory)).toEqual({
      label: 'Jane Doe',
      email: 'jane@example.com',
    });
  });

  it('pretty-prints local part when directory misses', () => {
    expect(resolveCustodianDisplay('john.doe@example.com', directory)).toEqual({
      label: 'John Doe',
      email: 'john.doe@example.com',
    });
  });

  it('returns raw label when not an email', () => {
    expect(resolveCustodianDisplay('Scanner Bot', directory)).toEqual({
      label: 'Scanner Bot',
      email: 'Scanner Bot',
    });
  });
});

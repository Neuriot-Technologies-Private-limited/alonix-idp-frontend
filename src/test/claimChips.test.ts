import { describe, expect, it } from 'vitest';
import { highlightClaimIdsInHtml, normalizeClaimIds } from '../pages/chat/utils/claimChips';
import {
  claimIdFromClarificationOption,
  pinnedClaimIdFromAskResponse,
} from '../pages/chat/utils/sessionClaimId';

describe('claimChips', () => {
  it('normalizes and dedupes claim ids', () => {
    expect(normalizeClaimIds([' CLM-1 ', '', 'CLM-1', 'CLM-2'])).toEqual(['CLM-1', 'CLM-2']);
  });

  it('wraps known claim ids in answer html', () => {
    const html = highlightClaimIdsInHtml(
      '<p>Reserve for CLM-2026-001 is high.</p>',
      ['CLM-2026-001']
    );
    expect(html).toContain('data-claim-id="CLM-2026-001"');
    expect(html).toContain('# CLM-2026-001');
  });

  it('does not chip ids that were not provided', () => {
    const html = highlightClaimIdsInHtml('<p>Invoice INV-9 is unrelated.</p>', ['CLM-2026-001']);
    expect(html).not.toContain('data-claim-id');
    expect(html).toContain('INV-9');
  });
});

describe('sessionClaimId', () => {
  it('parses Claim <id> (name) labels', () => {
    expect(
      claimIdFromClarificationOption('Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)')
    ).toBe('B20ME076');
  });

  it('pins a single claim_id from the ask response', () => {
    expect(pinnedClaimIdFromAskResponse({ claim_id: 'B20ME076' })).toBe('B20ME076');
    expect(pinnedClaimIdFromAskResponse({ claim_ids: ['A', 'B'] })).toBeNull();
  });
});

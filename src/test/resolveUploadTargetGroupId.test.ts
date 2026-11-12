import { describe, expect, it } from 'vitest';
import { resolveUploadTargetGroupId } from '../pages/documents/hooks/upload/resolveUploadTargetGroupId';

describe('resolveUploadTargetGroupId', () => {
  it('prefers TopNav activeGroupId when it is an allowed upload workspace', () => {
    expect(
      resolveUploadTargetGroupId({
        activeGroupId: 'g-active',
        allowedGroupIds: ['g-newest', 'g-active'],
        previousTargetId: '',
      })
    ).toBe('g-active');
  });

  it('keeps a previous target that is still allowed (user override in modal)', () => {
    expect(
      resolveUploadTargetGroupId({
        activeGroupId: 'g-active',
        allowedGroupIds: ['g-newest', 'g-active', 'g-other'],
        previousTargetId: 'g-other',
      })
    ).toBe('g-other');
  });

  it('does not prefer first allowed (newest admin) over TopNav active', () => {
    expect(
      resolveUploadTargetGroupId({
        activeGroupId: 'g2',
        allowedGroupIds: ['g1', 'g2'],
        previousTargetId: '',
      })
    ).toBe('g2');
  });

  it('falls back to first allowed when active is not in the list', () => {
    expect(
      resolveUploadTargetGroupId({
        activeGroupId: 'g-viewer-only',
        allowedGroupIds: ['g-admin-a', 'g-admin-b'],
        previousTargetId: '',
      })
    ).toBe('g-admin-a');
  });

  it('clears stale previous target that is no longer allowed', () => {
    expect(
      resolveUploadTargetGroupId({
        activeGroupId: 'g2',
        allowedGroupIds: ['g1', 'g2'],
        previousTargetId: 'g-gone',
      })
    ).toBe('g2');
  });

  it('returns empty when there are no allowed workspaces', () => {
    expect(
      resolveUploadTargetGroupId({
        activeGroupId: 'g1',
        allowedGroupIds: [],
        previousTargetId: 'g1',
      })
    ).toBe('');
  });
});

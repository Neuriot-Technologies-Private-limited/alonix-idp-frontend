import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { ChatSidebar } from '../pages/chat/components/ChatSidebar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const session = {
  session_id: 'sess-1',
  title: 'Claim 8801',
  last_updated: '2026-08-17T06:00:00.000Z',
};

const pinnedSession = {
  session_id: 'sess-2',
  title: 'Pinned Claim',
  last_updated: '2026-08-16T06:00:00.000Z',
  is_pinned: true,
};

function renderSidebar(overrides: Partial<ComponentProps<typeof ChatSidebar>> = {}) {
  const onDownloadSession = vi.fn();
  const onDeleteSession = vi.fn();
  const onSelectSession = vi.fn();
  const onTogglePinSession = vi.fn();
  render(
    <ChatSidebar
      hidden={false}
      sessions={[session]}
      isSessionsListLoading={false}
      hasMoreSessions={false}
      isFetchingNextSessionsPage={false}
      onLoadMoreSessions={() => {}}
      currentSession="sess-1"
      onNewChat={() => {}}
      onSelectSession={onSelectSession}
      onDownloadSession={onDownloadSession}
      onDeleteSession={onDeleteSession}
      onTogglePinSession={onTogglePinSession}
      formatSessionMeta={() => 'Just now'}
      {...overrides}
    />,
  );
  return { onDownloadSession, onDeleteSession, onSelectSession, onTogglePinSession };
}

describe('ChatSidebar session actions', () => {
  it('calls download with session id and title without selecting or deleting', () => {
    const { onDownloadSession, onDeleteSession, onSelectSession } = renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'downloadSession' }));

    expect(onDownloadSession).toHaveBeenCalledWith('sess-1', 'Claim 8801');
    expect(onDeleteSession).not.toHaveBeenCalled();
    expect(onSelectSession).not.toHaveBeenCalled();
  });

  it('still deletes from the trash control only', () => {
    const { onDownloadSession, onDeleteSession } = renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'deleteSession' }));

    expect(onDeleteSession).toHaveBeenCalledWith('sess-1');
    expect(onDownloadSession).not.toHaveBeenCalled();
  });
});

describe('ChatSidebar pin/unpin', () => {
  it('renders pin button with pinSession label for unpinned session', () => {
    renderSidebar();

    const pinBtn = screen.getByRole('button', { name: 'pinSession' });
    expect(pinBtn).toBeDefined();
  });

  it('calls onTogglePinSession(id, true) when clicking pin on an unpinned session', () => {
    const { onTogglePinSession, onSelectSession } = renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'pinSession' }));

    expect(onTogglePinSession).toHaveBeenCalledWith('sess-1', true);
    expect(onSelectSession).not.toHaveBeenCalled();
  });

  it('renders unpinSession label and calls toggle(id, false) for a pinned session', () => {
    const { onTogglePinSession } = renderSidebar({
      sessions: [pinnedSession],
      currentSession: 'sess-2',
    });

    const unpinBtn = screen.getByRole('button', { name: 'unpinSession' });
    expect(unpinBtn).toBeDefined();

    fireEvent.click(unpinBtn);
    expect(onTogglePinSession).toHaveBeenCalledWith('sess-2', false);
  });

  it('does not render pin button when onTogglePinSession is not provided', () => {
    renderSidebar({ onTogglePinSession: undefined });

    expect(screen.queryByRole('button', { name: 'pinSession' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'unpinSession' })).toBeNull();
  });

  it('pin button click does not propagate (no session select)', () => {
    const { onTogglePinSession, onSelectSession } = renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'pinSession' }));

    expect(onTogglePinSession).toHaveBeenCalledTimes(1);
    expect(onSelectSession).not.toHaveBeenCalled();
  });

  it('pinned session action buttons are always visible (opacity-100)', () => {
    renderSidebar({
      sessions: [pinnedSession],
      currentSession: null,
    });

    const unpinBtn = screen.getByRole('button', { name: 'unpinSession' });
    const actionsContainer = unpinBtn.parentElement;
    expect(actionsContainer?.className).toContain('opacity-100');
  });

  it('missing is_pinned treated as unpinned (shows pinSession label)', () => {
    const sessionWithoutPin = {
      session_id: 'sess-3',
      title: 'No pin field',
      last_updated: '2026-08-17T06:00:00.000Z',
    };
    renderSidebar({ sessions: [sessionWithoutPin], currentSession: 'sess-3' });

    expect(screen.getByRole('button', { name: 'pinSession' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'unpinSession' })).toBeNull();
  });
});

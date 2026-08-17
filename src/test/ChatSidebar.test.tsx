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

function renderSidebar(overrides: Partial<ComponentProps<typeof ChatSidebar>> = {}) {
  const onDownloadSession = vi.fn();
  const onDeleteSession = vi.fn();
  const onSelectSession = vi.fn();
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
      formatSessionMeta={() => 'Just now'}
      {...overrides}
    />
  );
  return { onDownloadSession, onDeleteSession, onSelectSession };
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

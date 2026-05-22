import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { ChatSessionDto } from '../../../services/chatApi';
import { useTranslation } from 'react-i18next';

type ChatSidebarProps = {
  hidden: boolean;
  sessions: ChatSessionDto[];
  isSessionLoading: boolean;
  currentSession: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void | Promise<void>;
  onDeleteSession: (id: string) => void | Promise<void>;
  formatSessionMeta: (iso: string) => string;
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  hidden,
  sessions,
  isSessionLoading,
  currentSession,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  formatSessionMeta,
}) => {
  const { t } = useTranslation('chat');
  return (
    <aside
      className={cn(
        'flex flex-col bg-surface-highest/20 backdrop-blur-xl transition-[width,opacity,min-width,max-width] duration-300 ease-out',
        hidden
          ? 'pointer-events-none w-0 min-w-0 max-w-0 shrink-0 overflow-hidden border-0 p-0 opacity-0'
          : 'w-[min(100vw,12rem)] shrink-0 border-r border-border/40 sm:w-[13rem]'
      )}
    >
      <div className="border-b border-border/10 px-2.5 py-3 sm:px-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px] sm:tracking-[0.22em]">
          {t('chatsLabel')}
        </p>
        <button
          type="button"
          onClick={onNewChat}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-gradient-to-b from-primary/15 to-primary/5 px-2 py-2 text-xs font-medium text-primary shadow-glass transition hover:border-primary/40 hover:from-primary/25 hover:to-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 sm:mt-3 sm:gap-2 sm:rounded-xl sm:px-2.5 sm:py-2.5 sm:text-sm"
        >
          <MessageSquarePlus className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" strokeWidth={2} />
          <span className="leading-tight">{t('newChat')}</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2 sm:px-2 sm:py-3">
        {isSessionLoading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-xs text-muted-foreground">{t('loadingSessions')}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="mx-1 rounded-xl border border-dashed border-border/60 bg-surface-highest/10 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground/70">{t('noConversations')}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/60">
              {t('noConversationsHint')}
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.session_id} className="group flex items-stretch gap-0.5">
                <button
                  type="button"
                  className={cn(
                    'min-w-0 flex-1 rounded-lg border border-transparent px-2 py-2 text-left transition sm:rounded-xl sm:px-3 sm:py-2.5',
                    currentSession === session.session_id
                      ? 'border-primary/30 bg-primary/10'
                      : 'hover:border-border/60 hover:bg-surface-highest/10'
                  )}
                  title={session.title}
                  onClick={() => void onSelectSession(session.session_id)}
                >
                  <span className="line-clamp-2 text-xs font-medium leading-snug text-foreground sm:text-sm">
                    {session.title}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatSessionMeta(session.last_updated)}
                  </span>
                </button>
                <button
                  type="button"
                  className={cn(
                    'flex shrink-0 items-center self-center rounded-lg p-2 text-muted-foreground/60 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100',
                    currentSession === session.session_id && 'opacity-100'
                  )}
                  title={t('deleteSession')}
                  aria-label={t('deleteSession')}
                  onClick={(e) => {
                    e.stopPropagation();
                    void onDeleteSession(session.session_id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};


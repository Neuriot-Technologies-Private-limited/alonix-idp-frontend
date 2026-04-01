import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquarePlus, SendHorizontal, Trash2 } from 'lucide-react';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { applyActiveGroupToContext } from '../../core/rbac/capabilities';
import {
  askQuestion,
  deleteChat,
  getChatHistory,
  getChatSessions,
  getFreshSourceUrl,
  getMyContext,
  type ChatSessionDto,
} from '../../services/chatApi';
import { connectSocket } from '../../services/chatSocket';

/** Referenced in DOM createElement — keep so Tailwind can scan utility strings */
const SOURCE_PILL_CLASS =
  'inline-block align-baseline rounded-full bg-info/10 px-2 py-0.5 mx-0.5 text-sm cursor-pointer border border-info/20 text-info transition hover:bg-info/20 hover:border-info/30 hover:-translate-y-px';

interface NormSource {
  title: string;
  url: string;
  page?: number;
  confidence?: number;
  file_path?: string;
  fileKey?: string;
  source_file?: unknown;
  source_type?: string;
}

interface ConversationPair {
  user: { text: string };
  ai: {
    text: string;
    sources: NormSource[];
    sourcesMap: Record<string, NormSource>;
    rawAnswer: string;
  };
}

function mdToHtml(raw: string): string {
  try {
    const out = marked.parse(raw || '', { async: false });
    return typeof out === 'string' ? out : '';
  } catch {
    return raw || '';
  }
}

function normalizeSource(src: unknown): NormSource {
  if (!src || typeof src !== 'object') {
    return { title: 'Source', url: '#' };
  }
  const s = src as Record<string, unknown>;
  if (typeof s.document === 'string') {
    const fileNameWithUUID = s.document.split('/').pop() || s.document;
    const fileName = fileNameWithUUID.replace(/^[a-f0-9]{32}_/, '');
    const pageNum = s.page ?? s.page_number;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'application/pdf';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'gif') mimeType = 'image/gif';
    return {
      title: fileName,
      url: '#',
      page: pageNum ? Number(pageNum) : undefined,
      confidence: s.confidence as number | undefined,
      file_path: s.file_path as string | undefined,
      source_file: s.array_buffer ?? s.source_file,
      source_type: (s.type as string) || mimeType,
    };
  }
  const titleRaw =
    String(
      (s.title as string)?.split('/').pop() ||
        (s.file_name as string)?.split('/').pop() ||
        (s.filename as string)?.split('/').pop() ||
        'Source'
    );
  const fileName = titleRaw.replace(/^[a-f0-9]{32}_/, '');
  const pageNum = s.page ?? s.page_number;
  return {
    title: fileName,
    url: (s.url as string) || (s.link as string) || '#',
    page: pageNum ? Number(pageNum) : undefined,
    confidence: s.confidence as number | undefined,
    file_path: s.file_path as string | undefined,
    source_file: s.source_file,
    source_type: (s.type as string) || 'application/pdf',
  };
}

function parseHtmlWithSources(html: string, sourcesMap: Record<string, NormSource>): string {
  const sourceGroupPattern = /\[(?:Source\s+\d+\s*(?:,\s*)?)+\]/gi;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (current.nodeType === Node.TEXT_NODE) textNodes.push(current as Text);
  }

  textNodes.forEach((node) => {
    const txt = node.textContent || '';
    const matches = [...txt.matchAll(sourceGroupPattern)];
    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    matches.forEach((match) => {
      if (match.index === undefined) return;
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(txt.substring(lastIndex, match.index)));
      }
      const nums = [...match[0].matchAll(/Source\s+(\d+)/gi)].map((m) => m[1]);
      if (nums.length > 0) {
        nums.forEach((num, i) => {
          const sourceKey = `[Source ${num}]`;
          const source =
            sourcesMap[sourceKey] || sourcesMap[`Source ${num}`] || sourcesMap[num];
          if (source) {
            const pill = document.createElement('span');
            pill.className = SOURCE_PILL_CLASS;
            pill.setAttribute('data-source-key', sourceKey);
            pill.setAttribute('data-source-title', source.title || sourceKey);
            pill.setAttribute('data-source-page', source.page != null ? String(source.page) : '');
            pill.setAttribute('data-source-filepath', source.file_path ?? '');
            pill.setAttribute('data-source-confidence', String(source.confidence ?? ''));
            pill.textContent = '↗';
            fragment.appendChild(pill);
            if (i < nums.length - 1) fragment.appendChild(document.createTextNode(' '));
          } else {
            fragment.appendChild(document.createTextNode(sourceKey));
          }
        });
      } else {
        fragment.appendChild(document.createTextNode(match[0]));
      }
      lastIndex = match.index + match[0].length;
    });
    if (lastIndex < txt.length) {
      fragment.appendChild(document.createTextNode(txt.substring(lastIndex)));
    }
    node.parentNode?.replaceChild(fragment, node);
  });
  return tempDiv.innerHTML;
}

function formatSessionMeta(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const ChatPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const context = useAuthStore((s) => s.context);
  const updateContext = useAuthStore((s) => s.updateContext);

  const [conversationPairs, setConversationPairs] = useState<ConversationPair[]>([]);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [chatDataState, setChatDataState] = useState<ChatSessionDto[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const [text, setText] = useState('');
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const scrollToLastItem = useRef<HTMLDivElement>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, title: '', msg: '' });
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'ok' } | null>(null);
  const prevResolvedGroupIdRef = useRef<string | null>(null);

  const userEmail = (user?.email || '').trim();
  const activeGroupId = context?.activeGroupId || user?.groupID || user?.groupId || '';
  const activeGroup = context?.groups?.find((g) => g.groupId === activeGroupId);
  const collectionName = activeGroup?.groupName || user?.groupName || '';

  const showToast = useCallback((msg: string, type: 'error' | 'ok' = 'error') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const handleDeleteChatSession = async (sessionId: string) => {
    if (!sessionId || !userEmail) return;
    try {
      await deleteChat(sessionId, activeGroupId || undefined);
      if (currentSession === sessionId) {
        createNewChat();
      }
      void loadChatSessions();
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string; error?: string } } };
      const backendMsg =
        ax?.response?.data?.message ||
        ax?.response?.data?.error ||
        (error instanceof Error ? error.message : '') ||
        'Failed to delete chat session.';
      setAlertModal({ open: true, title: 'Delete chat failed', msg: backendMsg });
      setErrorText(backendMsg);
      showToast(backendMsg, 'error');
    }
  };

  const handleSourceClick = async (e: React.MouseEvent, source: NormSource) => {
    e.preventDefault();
    try {
      let mimeType = source.source_type || 'application/pdf';
      if (mimeType && !mimeType.includes('/')) {
        const lower = mimeType.toLowerCase();
        if (lower === 'pdf') mimeType = 'application/pdf';
        else if (lower === 'png') mimeType = 'image/png';
        else if (lower === 'jpg' || lower === 'jpeg') mimeType = 'image/jpeg';
        else mimeType = 'application/octet-stream';
      }

      const fileKey = source.file_path || source.fileKey || null;
      if (fileKey) {
        const fresh = await getFreshSourceUrl(fileKey, null, activeGroupId || undefined);
        const freshUrl = fresh?.data?.url;
        if (freshUrl) {
          let url = freshUrl;
          if (mimeType === 'application/pdf' && source.page) {
            url = `${url}#page=${source.page}`;
          }
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      if (!source.source_file) return;

      if (typeof source.source_file === 'string') {
        if (
          source.source_file.startsWith('http://') ||
          source.source_file.startsWith('https://')
        ) {
          let url = source.source_file;
          if (mimeType === 'application/pdf' && source.page) {
            url = `${url}#page=${source.page}`;
          }
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      let blobUrl: string;
      if (source.source_file instanceof ArrayBuffer) {
        blobUrl = URL.createObjectURL(new Blob([source.source_file], { type: mimeType }));
      } else if (source.source_file instanceof Blob) {
        blobUrl = URL.createObjectURL(source.source_file);
      } else if (typeof source.source_file === 'string') {
        let b64 = source.source_file;
        if (b64.includes(',')) b64 = b64.split(',')[1];
        b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) b64 += '=';
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        blobUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
      } else return;

      let url = blobUrl;
      if (mimeType === 'application/pdf' && source.page) url = `${blobUrl}#page=${source.page}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      const msg = 'Failed to load document.';
      setErrorText(msg);
      showToast(msg, 'error');
    }
  };

  const loadChatSessions = async (groupIdOverride?: string) => {
    setIsSessionLoading(true);
    const gid = groupIdOverride ?? activeGroupId;
    const sortSessions = (list: ChatSessionDto[]) =>
      [...list].sort(
        (a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      );

    try {
      const response = await getChatSessions(gid || undefined);
      const sessions = response.data?.sessions || [];
      setChatDataState(sortSessions(sessions));
    } catch {
      showToast('Failed to load chat sessions.', 'error');
    } finally {
      setIsSessionLoading(false);
    }
  };

  const createNewChat = () => {
    setConversationPairs([]);
    setCurrentSession(null);
    setText('');
    setErrorText('');
  };

  const fetchAnswer = async (query: string, sessionId: string) => {
    const gid = activeGroupId || user?.groupID || user?.groupId || '';
    const response = await askQuestion(
      query,
      collectionName,
      gid,
      sessionId,
      null
    );
    return response.data;
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || isResponseLoading) return;
    setIsResponseLoading(true);
    setErrorText('');
    let sessionId = currentSession;
    if (!sessionId) {
      sessionId = uuidv4();
      setCurrentSession(sessionId);
    }
    try {
      const apiResponse = await fetchAnswer(text, sessionId);
      if (apiResponse.session_id && apiResponse.session_id !== currentSession) {
        setCurrentSession(apiResponse.session_id);
      }

      let sourcesArray: NormSource[] = [];
      let sourcesMap: Record<string, NormSource> = {};
      const rawSrc = apiResponse.sources;
      if (rawSrc) {
        if (Array.isArray(rawSrc)) {
          sourcesArray = Array.from(
            new Map(
              rawSrc.map((src) => {
                const n = normalizeSource(src);
                return [`${n.title}|${n.page}`, n];
              })
            ).values()
          );
        } else if (typeof rawSrc === 'object') {
          Object.keys(rawSrc).forEach((key) => {
            const n = normalizeSource((rawSrc as Record<string, unknown>)[key]);
            sourcesMap[key] = n;
            const numMatch = key.match(/Source\s+(\d+)/i);
            if (numMatch?.[1]) sourcesMap[`Source ${numMatch[1]}`] = n;
            sourcesArray.push(n);
          });
        }
      }

      setConversationPairs((prev) => [
        ...prev,
        {
          user: { text },
          ai: {
            text: mdToHtml(apiResponse.answer || '') || 'No answer returned.',
            sources: sourcesArray,
            sourcesMap,
            rawAnswer: apiResponse.answer || '',
          },
        },
      ]);
      setText('');
      if (userEmail) void loadChatSessions();
    } catch {
      const msg = 'Failed to get answer.';
      setErrorText(msg);
      showToast(msg, 'error');
    } finally {
      setIsResponseLoading(false);
    }
  };

  const selectChatSession = async (sessionId: string) => {
    if (!userEmail) return;
    setCurrentSession(sessionId);
    setIsSessionLoading(true);
    setErrorText('');

    try {
      const response = await getChatHistory(sessionId, activeGroupId || undefined);
      const messages = Array.isArray(response.data) ? response.data : [];

      const pairs: ConversationPair[] = (messages as Record<string, unknown>[]).map((msg) => {
        let sources: NormSource[] = [];
        let sourcesMap: Record<string, NormSource> = {};
        const rawSources = msg.sources;
        if (rawSources) {
          if (Array.isArray(rawSources)) {
            sources = Array.from(
              new Map(
                rawSources.map((src) => {
                  const n = normalizeSource(src);
                  return [`${n.title}|${n.page}`, n];
                })
              ).values()
            );
          } else if (typeof rawSources === 'object') {
            Object.keys(rawSources as object).forEach((key) => {
              const n = normalizeSource((rawSources as Record<string, unknown>)[key]);
              sourcesMap[key] = n;
              sources.push(n);
            });
          }
        }
        const res = msg.response as Record<string, string> | undefined;
        const raw =
          (msg.answer as string) ||
          res?.response ||
          (msg.res as string) ||
          '';
        return {
          user: { text: String(msg.query || '') },
          ai: {
            text: mdToHtml(raw) || 'No answer returned.',
            sources,
            sourcesMap,
            rawAnswer: raw,
          },
        };
      });

      setConversationPairs(pairs);
    } catch {
      const msg = 'Failed to load chat history.';
      setErrorText(msg);
      showToast(msg, 'error');
      setConversationPairs([]);
    } finally {
      setIsSessionLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !context) return;
    const email = (user.email || '').trim();
    let gid = context.activeGroupId || user.groupId || user.groupID || '';

    void (async () => {
      try {
        const ctxRes = await getMyContext();
        const ctx = ctxRes?.data?.context;
        if (ctx) {
          const local = useAuthStore.getState().context;
          const selectedId = local?.activeGroupId;
          if (selectedId && ctx.groups?.some((g) => g.groupId === selectedId)) {
            const merged = applyActiveGroupToContext(ctx, selectedId);
            updateContext(merged);
            gid = merged.activeGroupId || gid;
          } else {
            updateContext(ctx);
            gid = ctx.activeGroupId || gid;
          }
        }
      } catch {
        /* keep store context */
      }

      if (prevResolvedGroupIdRef.current !== null && prevResolvedGroupIdRef.current !== gid) {
        createNewChat();
      }
      prevResolvedGroupIdRef.current = gid;

      connectSocket(email, gid);
      void loadChatSessions(gid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap: refresh context once when user/context ids settle
  }, [user?.email, context?.activeGroupId]);

  useEffect(() => {
    if (scrollToLastItem.current) {
      scrollToLastItem.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationPairs, isResponseLoading]);

  const toggleSidebar = useCallback(() => setSidebarHidden((p) => !p), []);

  if (!user || !context) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Sign in to use chat.
      </div>
    );
  }

  const chatHeaderSubtitle = currentSession
    ? chatDataState.find((s) => s.session_id === currentSession)?.title || 'Active chat'
    : 'New conversation';

  return (
    <div className="relative flex min-h-0 flex-1 flex-row overflow-hidden -mx-4 w-[calc(100%+2rem)] max-w-none bg-gradient-to-br from-background via-surface-highest/10 to-background text-foreground lg:-mx-5 lg:w-[calc(100%+2.5rem)]">
      {/* ensure Tailwind emits SOURCE_PILL utilities */}
      <span className={cn('hidden', SOURCE_PILL_CLASS)} aria-hidden />

      <aside
        className={cn(
          'flex flex-col bg-surface-highest/20 backdrop-blur-xl transition-[width,opacity,min-width,max-width] duration-300 ease-out',
          sidebarHidden
            ? 'pointer-events-none w-0 min-w-0 max-w-0 shrink-0 overflow-hidden border-0 p-0 opacity-0'
            : 'w-[min(100vw,12rem)] shrink-0 border-r border-border/40 sm:w-[13rem]'
        )}
      >
        <div className="border-b border-border/10 px-2.5 py-3 sm:px-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px] sm:tracking-[0.22em]">
            Chats
          </p>
          <button
            type="button"
            onClick={createNewChat}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-gradient-to-b from-primary/15 to-primary/5 px-2 py-2 text-xs font-medium text-primary shadow-glass transition hover:border-primary/40 hover:from-primary/25 hover:to-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 sm:mt-3 sm:gap-2 sm:rounded-xl sm:px-2.5 sm:py-2.5 sm:text-sm"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" strokeWidth={2} />
            <span className="leading-tight">New chat</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2 sm:px-2 sm:py-3">
          {isSessionLoading && chatDataState.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="text-xs text-muted-foreground">Loading sessions…</p>
            </div>
          ) : chatDataState.length === 0 ? (
            <div className="mx-1 rounded-xl border border-dashed border-border/60 bg-surface-highest/10 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground/70">No conversations yet</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/60">
                Use <span className="text-muted-foreground">New chat</span> to begin
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {chatDataState.map((session) => (
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
                    onClick={() => void selectChatSession(session.session_id)}
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
                    title="Delete session"
                    aria-label="Delete session"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteChatSession(session.session_id);
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

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-background to-background">
        <header
          className={cn(
            'flex shrink-0 items-center border-b border-border/40 bg-surface-highest/10 py-2.5 backdrop-blur-md',
            sidebarHidden ? 'gap-2 px-2 sm:px-3' : 'gap-3 px-3 sm:px-4'
          )}
        >
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface-highest/20 text-muted-foreground/80 transition hover:border-border/90 hover:bg-surface-highest/30 hover:text-foreground"
            aria-label={
              sidebarHidden ? `Show chat list — ${chatHeaderSubtitle}` : 'Hide chat list'
            }
          >
            {sidebarHidden ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          {!sidebarHidden && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">Assistant</h1>
              <p className="truncate text-[11px] text-muted-foreground">{chatHeaderSubtitle}</p>
            </div>
          )}
        </header>

        {alertModal.open && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-scrim"
            onClick={() => setAlertModal({ open: false, title: '', msg: '' })}
            onKeyDown={(e) => e.key === 'Escape' && setAlertModal({ open: false, title: '', msg: '' })}
            role="presentation"
          >
            <div
              className="w-[92%] max-w-lg rounded-xl border border-border/20 bg-surface-lowest shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-border/10 px-5 py-4">
                <h2 className="text-base font-bold text-foreground">{alertModal.title}</h2>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setAlertModal({ open: false, title: '', msg: '' })}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="whitespace-pre-wrap break-words px-5 py-4 text-sm leading-snug text-muted-foreground/70">
                {alertModal.msg}
              </div>
              <div className="flex justify-end border-t border-border/10 px-5 py-3">
                <button
                  type="button"
                  className="rounded-lg border border-violet/30 bg-violet/20 px-3 py-2 text-sm font-semibold text-violet hover:bg-violet/30 hover:text-foreground"
                  onClick={() => setAlertModal({ open: false, title: '', msg: '' })}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {isSessionLoading && chatDataState.length > 0 && (
          <div className="flex items-center justify-center gap-2 border-b border-border/40 bg-surface-highest/10 py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
            <span className="text-xs text-muted-foreground">Loading…</span>
          </div>
        )}

        <div className="w-full shrink-0 px-4 pb-2 pt-2">
          {errorText && (
            <p className="mx-auto rounded-lg border border-destructive/25 bg-destructive/20 px-3 py-2 text-center text-sm text-destructive">
              {errorText}
            </p>
          )}
        </div>

        <main className="mx-auto flex min-h-0 w-full min-w-0 max-w-7xl flex-1 flex-col overflow-y-auto px-4 pb-2 sm:px-6 lg:px-8">
          {conversationPairs.map((pair, idx) => {
            const { user: uq, ai } = pair;
            const html =
              ai.sourcesMap && Object.keys(ai.sourcesMap).length > 0 && ai.rawAnswer
                ? parseHtmlWithSources(ai.text, ai.sourcesMap)
                : ai.text;
            return (
              <div
                key={idx}
                className="mb-6 overflow-hidden rounded-2xl border border-border/10 bg-surface-highest/10 shadow-xl shadow-glass backdrop-blur-sm"
              >
                <div className="border-b border-border/10 bg-gradient-to-r from-surface-highest/20 to-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Question
                  </div>
                  <div className="text-[15px] font-medium leading-relaxed text-foreground">{uq.text}</div>
                </div>
                {ai && (
                  <div className="bg-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Answer
                    </div>
                    <div
                      className="mt-1 space-y-1 break-words text-[15px] leading-[1.65] text-muted-foreground/80 [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-2 [&_code]:rounded-md [&_code]:bg-surface-highest/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/40 [&_pre]:bg-surface-highest/5 [&_pre]:p-4 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 [&_td]:text-left [&_th]:border [&_th]:border-border/60 [&_th]:bg-surface-highest/10 [&_th]:px-3 [&_th]:py-2 [&_tr:nth-child(even)]:bg-surface-highest/5"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: html }}
                      onClick={async (e) => {
                        const pill = (e.target as HTMLElement).closest('[data-source-key]');
                        if (pill) {
                          e.preventDefault();
                          e.stopPropagation();
                          const key = pill.getAttribute('data-source-key') || '';
                          const source = ai.sourcesMap[key];
                          if (source) {
                            const prevText = pill.textContent;
                            pill.innerHTML =
                              '<span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-border/30 border-t-primary" aria-label="Loading"></span>';
                            try {
                              await handleSourceClick(e, source);
                            } finally {
                              pill.textContent = prevText || '↗';
                            }
                          }
                        }
                      }}
                      onMouseOver={(e) => {
                        const pill = (e.target as HTMLElement).closest('[data-source-key]');
                        if (pill && !pill.hasAttribute('title-set')) {
                          const title = pill.getAttribute('data-source-title') || '';
                          const page = pill.getAttribute('data-source-page');
                          const fp = pill.getAttribute('data-source-filepath');
                          let tip = title;
                          if (page) tip += ` | Page ${page}`;
                          if (fp) tip += ` | ${fp}`;
                          pill.setAttribute('title', tip);
                          pill.setAttribute('title-set', 'true');
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {isResponseLoading && (
            <div className="mb-6 text-left">
              <div className="rounded-2xl border border-border/10 bg-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Thinking
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:0ms]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:150ms]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollToLastItem} />
        </main>

        <div className="shrink-0 space-y-1.5 border-t border-border/40 bg-surface-highest/20 px-4 pt-3 backdrop-blur-md sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <form
            className="mx-auto flex w-full max-w-7xl items-center gap-3 rounded-2xl border border-border/80 bg-surface-highest/20 px-4 py-1.5 shadow-inner shadow-glass transition focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20 sm:px-5"
            onSubmit={submitHandler}
          >
            <input
              type="text"
              spellCheck={false}
              placeholder="Ask something…"
              className="h-12 min-w-0 flex-1 border-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60"
              value={isResponseLoading ? 'Waiting for reply…' : text}
              onChange={(e) => setText(e.target.value)}
              readOnly={isResponseLoading}
            />
            {!isResponseLoading && (
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
                aria-label="Send"
              >
                <SendHorizontal className="h-5 w-5" strokeWidth={2} />
              </button>
            )}
          </form>
          <p className="mx-auto max-w-7xl text-center text-[11px] leading-relaxed text-muted-foreground/60">
            Findout Intelligence can make mistakes. Verify critical information.
          </p>
        </div>

        {toast && (
          <div
            className={cn(
              'fixed bottom-6 right-6 z-[10000] max-w-sm rounded-lg px-4 py-3 text-sm shadow-xl',
              toast.type === 'error'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-success text-success-foreground'
            )}
          >
            {toast.msg}
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatPage;

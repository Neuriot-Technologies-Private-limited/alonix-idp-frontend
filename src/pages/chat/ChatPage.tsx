import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  getDocumentAccessUrl,
  getMyContext,
  type ChatSessionDto,
} from '../../services/chatApi';
import { connectSocket, disconnectSocket } from '../../services/chatSocket';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatErrorBanner } from './components/ChatErrorBanner';
import { ChatComposer } from './components/ChatComposer';
import { ChatAlertModal } from './components/ChatAlertModal';
import { ChatToast } from './components/ChatToast';
import { useTranslation } from 'react-i18next';

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
  document?: string;
  document_id?: string;
  documentId?: string;
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
    const pathKey =
      (typeof s.file_path === 'string' && s.file_path) ||
      (typeof s.file_key === 'string' && s.file_key) ||
      (typeof s.document === 'string' && s.document) ||
      undefined;
    return {
      title: fileName,
      url: '#',
      page: pageNum ? Number(pageNum) : undefined,
      confidence: s.confidence as number | undefined,
      file_path: pathKey,
      fileKey: pathKey,
      document: typeof s.document === 'string' ? s.document : undefined,
      document_id:
        (typeof s.document_id === 'string' && s.document_id) ||
        (typeof s.documentId === 'string' && s.documentId) ||
        undefined,
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
  const pathKey =
    (typeof s.file_path === 'string' && s.file_path) ||
    (typeof s.file_key === 'string' && s.file_key) ||
    (typeof s.document === 'string' && s.document) ||
    undefined;
  return {
    title: fileName,
    url: (s.url as string) || (s.link as string) || '#',
    page: pageNum ? Number(pageNum) : undefined,
    confidence: s.confidence as number | undefined,
    file_path: pathKey,
    fileKey: pathKey,
    document: typeof s.document === 'string' ? s.document : undefined,
    document_id:
      (typeof s.document_id === 'string' && s.document_id) ||
      (typeof s.documentId === 'string' && s.documentId) ||
      undefined,
    source_file: s.source_file,
    source_type: (s.type as string) || 'application/pdf',
  };
}

function normalizeSourcesPayload(rawSources: unknown): {
  sources: NormSource[];
  sourcesMap: Record<string, NormSource>;
} {
  const sources: NormSource[] = [];
  const sourcesMap: Record<string, NormSource> = {};
  if (!rawSources) return { sources, sourcesMap };

  if (Array.isArray(rawSources)) {
    // Keep backend order/index 1:1 with answer citations like [Source 1].
    rawSources.forEach((src, idx) => {
      const s = normalizeSource(src);
      const n = idx + 1;
      sources.push(s);
      sourcesMap[`[Source ${n}]`] = s;
      sourcesMap[`Source ${n}`] = s;
      sourcesMap[String(n)] = s;
    });
    return { sources, sourcesMap };
  }

  if (typeof rawSources === 'object') {
    Object.keys(rawSources as object).forEach((key) => {
      const n = normalizeSource((rawSources as Record<string, unknown>)[key]);
      sources.push(n);
      sourcesMap[key] = n;
      const numMatch = key.match(/Source\s+(\d+)/i);
      if (numMatch?.[1]) {
        sourcesMap[`[Source ${numMatch[1]}]`] = n;
        sourcesMap[`Source ${numMatch[1]}`] = n;
        sourcesMap[numMatch[1]] = n;
      }
    });
  }

  return { sources, sourcesMap };
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
  const { t } = useTranslation('chat');
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
  const chatScrollRef = useRef<HTMLElement | null>(null);
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

      const documentId = source.document_id || source.documentId || null;
      if (documentId) {
        const byId = await getDocumentAccessUrl(documentId, activeGroupId || undefined);
        const freshUrl = byId?.data?.url;
        if (freshUrl) {
          let url = freshUrl;
          if (mimeType === 'application/pdf' && source.page) {
            url = `${url}#page=${source.page}`;
          }
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      const fileKey =
        source.file_path || source.fileKey || source.document || null;
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
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { error?: string } }; message?: string };
      const msg =
        ax?.response?.data?.error ||
        (error instanceof Error ? error.message : '') ||
        'Failed to load document.';
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

      const { sources: sourcesArray, sourcesMap } = normalizeSourcesPayload(apiResponse.sources);

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
        const { sources, sourcesMap } = normalizeSourcesPayload(msg.sources);
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
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const scrollEl = chatScrollRef.current;
    if (!scrollEl) return;
    requestAnimationFrame(() => {
      scrollEl.scrollTo({
        top: scrollEl.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [conversationPairs, isResponseLoading]);

  const toggleSidebar = useCallback(() => setSidebarHidden((p) => !p), []);

  if (!user || !context) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {t('signInRequired')}
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

      <ChatSidebar
        hidden={sidebarHidden}
        sessions={chatDataState}
        isSessionLoading={isSessionLoading}
        currentSession={currentSession}
        onNewChat={createNewChat}
        onSelectSession={(id) => void selectChatSession(id)}
        onDeleteSession={(id) => void handleDeleteChatSession(id)}
        formatSessionMeta={formatSessionMeta}
      />

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-background to-background">
        <ChatHeader sidebarHidden={sidebarHidden} subtitle={chatHeaderSubtitle} onToggleSidebar={toggleSidebar} />

        <ChatAlertModal
          state={alertModal}
          onClose={() => setAlertModal({ open: false, title: '', msg: '' })}
        />

        {isSessionLoading && chatDataState.length > 0 && (
          <div className="flex items-center justify-center gap-2 border-b border-border/40 bg-surface-highest/10 py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
            <span className="text-xs text-muted-foreground">Loading…</span>
          </div>
        )}

        <ChatErrorBanner message={errorText} />

        <main
          ref={chatScrollRef}
          className="mx-auto flex min-h-0 w-full min-w-0 max-w-7xl flex-1 flex-col overflow-y-auto overscroll-contain scroll-pb-28 px-4 pb-6 sm:px-6 lg:px-8"
        >
          {conversationPairs.map((pair, idx) => {
            const { user: uq, ai } = pair;
            const html =
              ai.sourcesMap && Object.keys(ai.sourcesMap).length > 0 && ai.rawAnswer
                ? parseHtmlWithSources(ai.text, ai.sourcesMap)
                : ai.text;
            return (
              <div
                key={idx}
                className="mb-7 h-auto rounded-2xl border border-border/10 bg-surface-highest/10 shadow-xl shadow-glass backdrop-blur-sm sm:mb-8"
              >
                <div className="border-b border-border/10 bg-gradient-to-r from-surface-highest/20 to-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {t('question')}
                  </div>
                  <div className="text-[15px] font-medium leading-relaxed text-foreground">{uq.text}</div>
                </div>
                {ai && (
                  <div className="bg-surface-highest/10 px-5 py-5 sm:px-7 sm:py-6">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {t('answer')}
                    </div>
                    <div
                      className="mt-1 space-y-1 overflow-visible break-words whitespace-pre-wrap pb-1 text-[15px] leading-[1.65] text-muted-foreground/80 [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-2 [&_code]:rounded-md [&_code]:bg-surface-highest/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/40 [&_pre]:bg-surface-highest/5 [&_pre]:p-4 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 [&_td]:text-left [&_th]:border [&_th]:border-border/60 [&_th]:bg-surface-highest/10 [&_th]:px-3 [&_th]:py-2 [&_tr:nth-child(even)]:bg-surface-highest/5"
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
                  {t('thinking')}
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:0ms]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:150ms]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

        </main>

        <ChatComposer
          value={text}
          isResponseLoading={isResponseLoading}
          onChange={setText}
          onSubmit={submitHandler}
        />

        <ChatToast toast={toast} />
      </section>
    </div>
  );
};

export default ChatPage;

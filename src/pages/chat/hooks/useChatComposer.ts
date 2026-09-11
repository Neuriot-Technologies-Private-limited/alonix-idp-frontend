import { useCallback, useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { askQuestion } from '../../../services/chatApi';
import { quotaErrorMessage } from '../../../utils/billingQuota';
import { mapApiAnswerToPair } from '../utils/mapChatMessages';
import {
  extractClarificationOptions,
  resolveResponseKind,
} from '../utils/clarificationOptions';
import { claimIdFromClarificationOption, pinnedClaimIdFromAskResponse } from '../utils/sessionClaimId';
import type { ConversationPair, PendingChatQuery } from '../types/chatConversation';

interface UseChatComposerOptions {
  collectionName: string;
  activeGroupId: string;
  qaBlocked: boolean;
  capMessage: (key: 'questionsMonth') => string;
  currentSession: string | null;
  setCurrentSession: (id: string | null) => void;
  setConversationPairs: Dispatch<SetStateAction<ConversationPair[]>>;
  onAnswerSuccess: () => void;
  showToast: (msg: string, type?: 'error' | 'ok') => void;
}

export function useChatComposer({
  collectionName,
  activeGroupId,
  qaBlocked,
  capMessage,
  currentSession,
  setCurrentSession,
  setConversationPairs,
  onAnswerSuccess,
  showToast,
}: UseChatComposerOptions) {
  const [text, setText] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [pendingQuery, setPendingQuery] = useState<PendingChatQuery | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeSessionRef = useRef<string | null>(currentSession);

  useEffect(() => {
    activeSessionRef.current = currentSession;
  }, [currentSession]);

  const clearComposerError = useCallback(() => setErrorText(''), []);

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const submitQuery = useCallback(
    async (queryText: string, claimIdOverride?: string | null) => {
      const trimmed = queryText.trim();
      if (!trimmed || isResponseLoading) return;
      if (qaBlocked) {
        const msg = capMessage('questionsMonth');
        setErrorText(msg);
        showToast(msg, 'error');
        return;
      }
      const claimForRequest = claimIdOverride !== undefined ? claimIdOverride : selectedClaimId;
      setIsResponseLoading(true);
      setErrorText('');
      let sessionId = currentSession;
      if (!sessionId) {
        sessionId = uuidv4();
        setCurrentSession(sessionId);
      }
      const requestSessionId = sessionId;
      activeSessionRef.current = requestSessionId;
      setPendingQuery({ sessionId: requestSessionId, text: trimmed });
      setText('');
      try {
        const response = await askQuestion(
          trimmed,
          collectionName,
          activeGroupId,
          sessionId,
          null,
          claimForRequest
        );
        const apiResponse = response.data;
        console.info('[qa] ask response', {
          claim_id_sent: claimForRequest || null,
          claim_id: apiResponse?.claim_id ?? null,
          claim_ids: apiResponse?.claim_ids ?? null,
          claimIds: apiResponse?.claimIds ?? null,
          response_kind: apiResponse?.response_kind ?? apiResponse?.responseKind ?? null,
          status: apiResponse?.status ?? null,
          options: apiResponse?.options ?? null,
          clarification_options: apiResponse?.clarification_options ?? null,
          keys: Object.keys(apiResponse || {}),
          answer_preview: String(apiResponse?.answer || '').slice(0, 240),
        });
        const stillOnRequestSession = activeSessionRef.current === requestSessionId;
        if (!stillOnRequestSession) {
          onAnswerSuccess();
          return;
        }
        if (apiResponse.session_id && apiResponse.session_id !== requestSessionId) {
          setCurrentSession(apiResponse.session_id);
        }
        const pinnedClaimId = pinnedClaimIdFromAskResponse(apiResponse);
        if (pinnedClaimId) setSelectedClaimId(pinnedClaimId);
        else if (claimIdOverride !== undefined) setSelectedClaimId(claimIdOverride);
        const responseKind = resolveResponseKind(apiResponse);
        const clarificationOptions = extractClarificationOptions(apiResponse);
        setConversationPairs((prev) => [
          ...prev,
          mapApiAnswerToPair(
            trimmed,
            apiResponse.answer || '',
            responseKind === 'clarification' ? null : apiResponse.sources,
            responseKind,
            clarificationOptions,
            apiResponse.query_id,
            {
              userClaimId: claimForRequest,
              claimIds: apiResponse.claim_ids ?? apiResponse.claimIds,
            }
          ),
        ]);
        onAnswerSuccess();
      } catch (err) {
        if (activeSessionRef.current === requestSessionId) {
          setText(trimmed);
          const msg = quotaErrorMessage(err, 'Failed to get answer.');
          setErrorText(msg);
          showToast(msg, 'error');
        }
      } finally {
        setPendingQuery(null);
        setIsResponseLoading(false);
      }
    },
    [
      activeGroupId,
      capMessage,
      collectionName,
      currentSession,
      isResponseLoading,
      onAnswerSuccess,
      qaBlocked,
      selectedClaimId,
      setConversationPairs,
      setCurrentSession,
      showToast,
    ]
  );

  const submitHandler = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      await submitQuery(text);
    },
    [submitQuery, text]
  );

  const submitClarificationOption = useCallback(
    async (optionText: string) => {
      const parsed = claimIdFromClarificationOption(optionText);
      if (parsed) setSelectedClaimId(parsed);
      await submitQuery(optionText, parsed ?? selectedClaimId);
    },
    [selectedClaimId, submitQuery]
  );

  return {
    text,
    setText,
    selectedClaimId,
    setSelectedClaimId,
    isResponseLoading,
    errorText,
    setErrorText,
    clearComposerError,
    submitHandler,
    submitClarificationOption,
    inputRef,
    focusComposer,
    pendingQuery,
  };
}

import { useCallback, useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { askQuestion } from '../../../services/chatApi';
import { quotaErrorMessage } from '../../../utils/billingQuota';
import { mapApiAnswerToPair } from '../utils/mapChatMessages';
import {
  extractClarificationOptions,
  resolveResponseKind,
} from '../utils/clarificationOptions';
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
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed || isResponseLoading) return;
      if (qaBlocked) {
        const msg = capMessage('questionsMonth');
        setErrorText(msg);
        showToast(msg, 'error');
        return;
      }
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
          selectedClaimId
        );
        const apiResponse = response.data;
        const stillOnRequestSession = activeSessionRef.current === requestSessionId;
        if (!stillOnRequestSession) {
          onAnswerSuccess();
          return;
        }
        if (apiResponse.session_id && apiResponse.session_id !== requestSessionId) {
          setCurrentSession(apiResponse.session_id);
        }
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
            apiResponse.query_id
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
      await submitQuery(optionText);
    },
    [submitQuery]
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

import { useCallback, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { askQuestion } from '../../../services/chatApi';
import { quotaErrorMessage } from '../../../utils/billingQuota';
import { mapApiAnswerToPair } from '../utils/mapChatMessages';
import {
  extractClarificationOptions,
  resolveResponseKind,
} from '../utils/clarificationOptions';
import type { ConversationPair } from '../types/chatConversation';

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
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const clearComposerError = useCallback(() => setErrorText(''), []);

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const submitQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim() || isResponseLoading) return;
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
      try {
        const response = await askQuestion(
          queryText,
          collectionName,
          activeGroupId,
          sessionId,
          null
        );
        const apiResponse = response.data;
        if (apiResponse.session_id && apiResponse.session_id !== currentSession) {
          setCurrentSession(apiResponse.session_id);
        }
        const responseKind = resolveResponseKind(apiResponse);
        const clarificationOptions = extractClarificationOptions(apiResponse);
        setConversationPairs((prev) => [
          ...prev,
          mapApiAnswerToPair(
            queryText,
            apiResponse.answer || '',
            responseKind === 'clarification' ? null : apiResponse.sources,
            responseKind,
            clarificationOptions,
            apiResponse.query_id
          ),
        ]);
        setText('');
        onAnswerSuccess();
      } catch (err) {
        const msg = quotaErrorMessage(err, 'Failed to get answer.');
        setErrorText(msg);
        showToast(msg, 'error');
      } finally {
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
    isResponseLoading,
    errorText,
    setErrorText,
    clearComposerError,
    submitHandler,
    submitClarificationOption,
    inputRef,
    focusComposer,
  };
}

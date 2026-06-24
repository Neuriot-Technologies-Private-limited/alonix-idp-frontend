import { useCallback, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { askQuestion } from '../../../services/chatApi';
import { quotaErrorMessage } from '../../../utils/billingQuota';
import { mapApiAnswerToPair } from '../utils/mapChatMessages';
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

  const clearComposerError = useCallback(() => setErrorText(''), []);

  const submitHandler = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!text || isResponseLoading) return;
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
      const queryText = text;
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
        const responseKind =
          apiResponse.response_kind === 'clarification' ? 'clarification' : 'answer';
        setConversationPairs((prev) => [
          ...prev,
          mapApiAnswerToPair(
            queryText,
            apiResponse.answer || '',
            responseKind === 'clarification' ? null : apiResponse.sources,
            responseKind
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
      text,
    ]
  );

  return {
    text,
    setText,
    isResponseLoading,
    errorText,
    setErrorText,
    clearComposerError,
    submitHandler,
  };
}

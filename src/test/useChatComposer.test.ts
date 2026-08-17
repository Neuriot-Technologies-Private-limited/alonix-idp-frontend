import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { FormEvent } from 'react';

const askQuestion = vi.fn();

vi.mock('../services/chatApi', () => ({
  askQuestion: (...args: unknown[]) => askQuestion(...args),
}));

import { useChatComposer } from '../pages/chat/hooks/useChatComposer';

function setup(currentSession: string | null = 'sess-1') {
  const setCurrentSession = vi.fn();
  const setConversationPairs = vi.fn();
  const onAnswerSuccess = vi.fn();
  const showToast = vi.fn();
  const hook = renderHook(() =>
    useChatComposer({
      collectionName: 'claims',
      activeGroupId: 'g1',
      qaBlocked: false,
      capMessage: () => 'quota',
      currentSession,
      setCurrentSession,
      setConversationPairs,
      onAnswerSuccess,
      showToast,
    })
  );
  return { ...hook, setCurrentSession, setConversationPairs, onAnswerSuccess, showToast };
}

describe('useChatComposer pending question', () => {
  beforeEach(() => {
    askQuestion.mockReset();
  });

  it('shows the asked question while waiting and clears it after the answer', async () => {
    let resolveAsk: (value: { data: { answer: string; query_id: string } }) => void = () => {};
    askQuestion.mockReturnValue(
      new Promise((resolve) => {
        resolveAsk = resolve;
      })
    );

    const { result } = setup();

    act(() => {
      result.current.setText('What is the insured name?');
    });

    await act(async () => {
      void result.current.submitHandler({ preventDefault() {} } as FormEvent);
    });

    expect(result.current.pendingQuery).toEqual({
      sessionId: 'sess-1',
      text: 'What is the insured name?',
    });
    expect(result.current.text).toBe('');
    expect(result.current.isResponseLoading).toBe(true);

    await act(async () => {
      resolveAsk({ data: { answer: 'Acme Corp', query_id: 'q1' } });
    });

    expect(result.current.pendingQuery).toBeNull();
    expect(result.current.isResponseLoading).toBe(false);
    expect(result.current.text).toBe('');
  });

  it('restores the question in the composer when the request fails', async () => {
    askQuestion.mockRejectedValueOnce(new Error('smtp'));
    const { result, showToast } = setup();

    act(() => {
      result.current.setText('Retry me');
    });

    await act(async () => {
      await result.current.submitHandler({ preventDefault() {} } as FormEvent);
    });

    expect(result.current.pendingQuery).toBeNull();
    expect(result.current.text).toBe('Retry me');
    expect(showToast).toHaveBeenCalled();
  });
});

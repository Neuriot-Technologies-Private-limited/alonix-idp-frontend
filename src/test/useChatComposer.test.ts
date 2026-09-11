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
    expect(askQuestion).toHaveBeenCalledWith(
      'What is the insured name?',
      'claims',
      'g1',
      'sess-1',
      null,
      null
    );
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

  it('sends the selected claim id with the question', async () => {
    askQuestion.mockResolvedValueOnce({ data: { answer: 'ok', query_id: 'q1' } });
    const { result } = setup();

    act(() => {
      result.current.setSelectedClaimId('CLM-9');
      result.current.setText('scope me');
    });

    await act(async () => {
      await result.current.submitHandler({ preventDefault() {} } as FormEvent);
    });

    expect(askQuestion).toHaveBeenCalledWith('scope me', 'claims', 'g1', 'sess-1', null, 'CLM-9');
  });

  it('sends a parsed claim id when a clarification option is chosen', async () => {
    askQuestion.mockResolvedValueOnce({
      data: { answer: 'Coverage A is $385,000.', query_id: 'q3', claim_id: 'B20ME076' },
    });
    const { result } = setup();

    await act(async () => {
      await result.current.submitClarificationOption(
        'Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)'
      );
    });

    expect(askQuestion).toHaveBeenCalledWith(
      'Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)',
      'claims',
      'g1',
      'sess-1',
      null,
      'B20ME076'
    );
    expect(result.current.selectedClaimId).toBe('B20ME076');
  });

  it('pins a claim id returned by the ask response', async () => {
    askQuestion.mockResolvedValueOnce({
      data: {
        answer: 'ok',
        query_id: 'q4',
        claim_id: 'B20ME076',
        claim_ids: ['B20ME076'],
      },
    });
    const { result } = setup();

    act(() => {
      result.current.setText('What are the limits?');
    });

    await act(async () => {
      await result.current.submitHandler({ preventDefault() {} } as FormEvent);
    });

    expect(result.current.selectedClaimId).toBe('B20ME076');
  });

  it('maps clarification options from the ask response onto the conversation pair', async () => {
    askQuestion.mockResolvedValueOnce({
      data: {
        answer: 'Multiple claims matched your query. Which claim are you referring to?',
        query_id: 'q2',
        responseKind: 'clarification',
        status: 'clarification_needed',
        options: ['Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)'],
        claim_id: 'B20ME076',
      },
    });
    const { result, setConversationPairs } = setup();

    act(() => {
      result.current.setText('What are the Coverage A limits?');
    });

    await act(async () => {
      await result.current.submitHandler({ preventDefault() {} } as FormEvent);
    });

    expect(setConversationPairs).toHaveBeenCalled();
    const updater = setConversationPairs.mock.calls[0][0];
    const next = typeof updater === 'function' ? updater([]) : updater;
    expect(next[0].ai.responseKind).toBe('clarification');
    expect(next[0].ai.clarificationOptions).toEqual([
      'Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)',
    ]);
    expect(result.current.selectedClaimId).toBe('B20ME076');
  });
});

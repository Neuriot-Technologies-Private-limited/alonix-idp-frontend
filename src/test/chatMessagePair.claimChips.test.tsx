import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessagePair } from '../pages/chat/components/ChatMessagePair';
import type { ConversationPair } from '../pages/chat/types/chatConversation';

const scopedPair: ConversationPair = {
  pairId: 'scoped',
  user: { text: 'What is the deductible on this claim?', claimId: 'CLM-2026-001' },
  ai: {
    text: '<p>The declarations page lists a $1,000 deductible for CLM-2026-001.</p>',
    sources: [],
    sourcesMap: {},
    rawAnswer: 'The declarations page lists a $1,000 deductible for CLM-2026-001.',
    responseKind: 'answer',
    claimIds: ['CLM-2026-001'],
  },
};

const unscopedPair: ConversationPair = {
  pairId: 'unscoped',
  user: { text: 'Which open claims have the highest reserves right now?' },
  ai: {
    text: '<p>CLM-2026-014 currently has the highest reserve.</p>',
    sources: [],
    sourcesMap: {},
    rawAnswer: 'CLM-2026-014 currently has the highest reserve.',
    responseKind: 'answer',
    claimIds: ['CLM-2026-014'],
  },
};

describe('ChatMessagePair claim chips', () => {
  it('shows a question chip when the user selected a claim id', () => {
    render(
      <ChatMessagePair
        pair={scopedPair}
        questionLabel="Question"
        answerLabel="Answer"
        clarificationLabel="Clarification needed"
        onSourceClick={async () => {}}
      />
    );
    expect(screen.getAllByText('CLM-2026-001').length).toBeGreaterThan(0);
    expect(screen.getByText(/\$1,000 deductible/i)).toBeInTheDocument();
  });

  it('shows answer chips when the model returns claim ids without a user selection', async () => {
    const user = userEvent.setup();
    const onClaimIdClick = vi.fn();
    render(
      <ChatMessagePair
        pair={unscopedPair}
        questionLabel="Question"
        answerLabel="Answer"
        clarificationLabel="Clarification needed"
        onSourceClick={async () => {}}
        onClaimIdClick={onClaimIdClick}
      />
    );
    expect(screen.getByText('Which open claims have the highest reserves right now?')).toBeInTheDocument();
    const chips = screen.getAllByRole('button', { name: /Filter chat by claim CLM-2026-014/i });
    expect(chips.length).toBeGreaterThan(0);
    await user.click(chips[0]);
    expect(onClaimIdClick).toHaveBeenCalledWith('CLM-2026-014');
  });

  it('renders clarification option rows from the API options array', () => {
    const pair: ConversationPair = {
      pairId: 'clarify',
      user: { text: 'What are the Coverage A and Coverage B limits on this policy?' },
      ai: {
        text: '<p>Multiple claims matched your query. Which claim are you referring to?</p>',
        sources: [],
        sourcesMap: {},
        rawAnswer: 'Multiple claims matched your query. Which claim are you referring to?',
        responseKind: 'clarification',
        clarificationOptions: ['Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)'],
        claimIds: [],
      },
    };
    render(
      <ChatMessagePair
        pair={pair}
        questionLabel="Question"
        answerLabel="Answer"
        clarificationLabel="Clarification needed"
        onSourceClick={async () => {}}
        clarificationOptionsInteractive
      />
    );
    expect(screen.getByText('Clarification needed')).toBeInTheDocument();
    expect(screen.getByText('Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)')).toBeInTheDocument();
    expect(screen.getByText('Custom input')).toBeInTheDocument();
  });
});

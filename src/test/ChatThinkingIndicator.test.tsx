import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatThinkingIndicator } from '../pages/chat/components/ChatThinkingIndicator';

describe('ChatThinkingIndicator', () => {
  it('shows the asked question with Thinking in the answer slot', () => {
    render(
      <ChatThinkingIndicator
        question="What is the insured name?"
        questionLabel="Question"
        answerLabel="Answer"
        label="Thinking"
      />
    );

    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('What is the insured name?')).toBeInTheDocument();
    expect(screen.getByText('Answer')).toBeInTheDocument();
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
  });

  it('keeps the compact thinking card when no question is provided', () => {
    render(<ChatThinkingIndicator label="Thinking" />);
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    expect(screen.queryByText('Question')).not.toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { normalizeSourcesPayload } from '../pages/chat/utils/chatSources';
import { mapApiAnswerToPair } from '../pages/chat/utils/mapChatMessages';
import {
  extractClarificationOptions,
  resolveResponseKind,
} from '../pages/chat/utils/clarificationOptions';
import { clarificationOptionLetter } from '../pages/chat/utils/clarificationOptionLetter';

describe('chatSources', () => {
  it('normalizeSourcesPayload maps array indices to citation keys', () => {
    const { sources, sourcesMap } = normalizeSourcesPayload([
      { title: 'report.pdf', file_name: 'report.pdf' },
    ]);
    expect(sources).toHaveLength(1);
    expect(sourcesMap['[Source 1]']?.title).toBe('report.pdf');
    expect(sourcesMap['Source 1']?.title).toBe('report.pdf');
  });
});

describe('mapChatMessages', () => {
  it('mapApiAnswerToPair builds clarification pair without sources', () => {
    const pair = mapApiAnswerToPair('What date?', 'Please specify the year.', null, 'clarification');
    expect(pair.user.text).toBe('What date?');
    expect(pair.ai.responseKind).toBe('clarification');
    expect(pair.ai.sources).toHaveLength(0);
    expect(pair.ai.clarificationOptions).toBeUndefined();
  });

  it('mapApiAnswerToPair attaches clarification options when provided', () => {
    const pair = mapApiAnswerToPair(
      'Which doctor?',
      'Please clarify which doctor you mean.',
      null,
      'clarification',
      ['Dr. Agarwal', 'Dr. Upendra']
    );
    expect(pair.ai.clarificationOptions).toEqual(['Dr. Agarwal', 'Dr. Upendra']);
  });
});

describe('clarificationOptions', () => {
  it('extractClarificationOptions prefers options then clarification_options', () => {
    expect(extractClarificationOptions({ options: ['A'] })).toEqual(['A']);
    expect(extractClarificationOptions({ clarification_options: ['B'] })).toEqual(['B']);
  });

  it('resolveResponseKind reads snake_case or camelCase', () => {
    expect(resolveResponseKind({ response_kind: 'clarification' })).toBe('clarification');
    expect(resolveResponseKind({ responseKind: 'clarification' })).toBe('clarification');
    expect(resolveResponseKind({ response_kind: 'answer' })).toBe('answer');
  });

  it('clarificationOptionLetter returns A, B, C', () => {
    expect(clarificationOptionLetter(0)).toBe('A');
    expect(clarificationOptionLetter(1)).toBe('B');
    expect(clarificationOptionLetter(2)).toBe('C');
  });
});

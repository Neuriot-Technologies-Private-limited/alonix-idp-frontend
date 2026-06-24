import { describe, it, expect } from 'vitest';
import { normalizeSourcesPayload } from '../pages/chat/utils/chatSources';
import { mapApiAnswerToPair } from '../pages/chat/utils/mapChatMessages';

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
  });
});

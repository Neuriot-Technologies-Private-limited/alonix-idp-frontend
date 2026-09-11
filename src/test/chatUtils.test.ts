import { describe, it, expect } from 'vitest';
import { normalizeSourcesPayload, parseHtmlWithSources } from '../pages/chat/utils/chatSources';
import { mapApiAnswerToPair, mapHistoryMessageToPair, resolvePairId } from '../pages/chat/utils/mapChatMessages';
import {
  extractClarificationOptions,
  resolveResponseKind,
} from '../pages/chat/utils/clarificationOptions';
import { mdToHtml } from '../pages/chat/utils/chatMarkdown';
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

  it('parseHtmlWithSources replaces [Source N] with an arrow pill only', () => {
    const { sourcesMap } = normalizeSourcesPayload([
      { title: 'a.pdf' },
      { title: 'b.pdf' },
      { title: 'policy.pdf' },
    ]);
    const html = parseHtmlWithSources(
      '<p>Deductible is $3,850 per occurrence [Source 3].</p>',
      sourcesMap
    );
    expect(html).toContain('data-source-key="[Source 3]"');
    expect(html).toContain('↗');
    expect(html.replace(/data-source-key="\[Source \d+\]"/g, '')).not.toMatch(/\[Source 3\]/);
    expect(html.replace(/data-source-[a-z-]+="[^"]*"/g, '')).not.toMatch(/Source 3/);
  });

  it('parseHtmlWithSources strips leftover [Source N] next to a citation link', () => {
    const html = parseHtmlWithSources(
      '<p>Deductible is $3,850 [Source 3] <a href="#src-3">Source 3</a>.</p>',
      {}
    );
    expect(html).toContain('↗');
    expect(html.replace(/data-source-[a-z-]+="[^"]*"/g, '')).not.toMatch(/Source 3/);
  });

  it('mdToHtml plus parseHtmlWithSources leaves only the arrow pill', () => {
    const html = parseHtmlWithSources(
      mdToHtml(
        'The wind and hail deductible for this policy is $3,850 per occurrence [Source 3]. This amount is calculated as 1% of the Coverage A Limit, which is $385,000 [Source 3].'
      ),
      { '[Source 3]': { title: 'policy.pdf', url: '#' } }
    );
    expect(html).toContain('↗');
    expect((html.match(/data-source-key="\[Source 3\]"/g) || []).length).toBeGreaterThanOrEqual(1);
    expect(html.replace(/data-source-[a-z-]+="[^"]*"/g, '')).not.toMatch(/\[Source 3\]/);
  });
});

describe('mapChatMessages', () => {
  it('mapApiAnswerToPair builds clarification pair without sources', () => {
    const pair = mapApiAnswerToPair('What date?', 'Please specify the year.', null, 'clarification');
    expect(pair.pairId).toBeTruthy();
    expect(pair.user.text).toBe('What date?');
    expect(pair.ai.responseKind).toBe('clarification');
    expect(pair.ai.sources).toHaveLength(0);
    expect(pair.ai.clarificationOptions).toBeUndefined();
  });

  it('mapApiAnswerToPair uses query_id when provided', () => {
    const pair = mapApiAnswerToPair('Q', 'A', null, 'answer', undefined, '507f1f77bcf86cd799439012');
    expect(pair.pairId).toBe('507f1f77bcf86cd799439012');
  });

  it('mapApiAnswerToPair attaches composer and API claim ids', () => {
    const pair = mapApiAnswerToPair(
      'What is the deductible?',
      'Deductible for CLM-9 is $1,000.',
      null,
      'answer',
      undefined,
      'q1',
      { userClaimId: 'CLM-9', claimIds: ['CLM-9'] }
    );
    expect(pair.user.claimId).toBe('CLM-9');
    expect(pair.ai.claimIds).toEqual(['CLM-9']);
  });

  it('mapHistoryMessageToPair uses query_id from history payload', () => {
    const pair = mapHistoryMessageToPair({
      query_id: 'abc123',
      query: 'Hello',
      answer: 'Hi',
    });
    expect(pair.pairId).toBe('abc123');
    expect(pair.user.text).toBe('Hello');
  });

  it('mapHistoryMessageToPair restores clarification options', () => {
    const pair = mapHistoryMessageToPair({
      query_id: 'q2',
      query: 'What are the Coverage A limits?',
      answer: 'Multiple claims matched your query. Which claim are you referring to?',
      response_kind: 'clarification',
      options: ['Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)'],
    });
    expect(pair.ai.responseKind).toBe('clarification');
    expect(pair.ai.clarificationOptions).toEqual([
      'Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)',
    ]);
  });

  it('resolvePairId prefers query_id then falls back', () => {
    expect(resolvePairId({ query_id: 'q1' })).toBe('q1');
    expect(resolvePairId({}, 'fallback-id')).toBe('fallback-id');
    expect(resolvePairId({})).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
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

  it('extractClarificationOptions reads object option labels', () => {
    expect(
      extractClarificationOptions({
        options: [{ label: 'Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)' }],
      })
    ).toEqual(['Claim B20ME076 (E. R. Marlowe, Evelyn R. Marlowe)']);
  });

  it('extractClarificationOptions wraps a single string option', () => {
    expect(extractClarificationOptions({ options: 'Claim B20ME076' })).toEqual(['Claim B20ME076']);
  });

  it('resolveResponseKind reads snake_case or camelCase', () => {
    expect(resolveResponseKind({ response_kind: 'clarification' })).toBe('clarification');
    expect(resolveResponseKind({ responseKind: 'clarification' })).toBe('clarification');
    expect(resolveResponseKind({ response_kind: 'answer' })).toBe('answer');
  });

  it('resolveResponseKind treats clarification_needed status as clarification', () => {
    expect(resolveResponseKind({ status: 'clarification_needed' })).toBe('clarification');
  });

  it('clarificationOptionLetter returns A, B, C', () => {
    expect(clarificationOptionLetter(0)).toBe('A');
    expect(clarificationOptionLetter(1)).toBe('B');
    expect(clarificationOptionLetter(2)).toBe('C');
  });
});

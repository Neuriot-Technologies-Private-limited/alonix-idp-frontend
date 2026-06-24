import type { ConversationPair } from '../types/chatConversation';
import { mdToHtml } from '../utils/chatMarkdown';
import { normalizeSourcesPayload } from '../utils/chatSources';

export function mapHistoryMessageToPair(msg: Record<string, unknown>): ConversationPair {
  const responseKind = msg.response_kind === 'clarification' ? 'clarification' : 'answer';
  const { sources, sourcesMap } = normalizeSourcesPayload(
    responseKind === 'clarification' ? null : msg.sources
  );
  const res = msg.response as Record<string, string> | undefined;
  const raw = (msg.answer as string) || res?.response || (msg.res as string) || '';
  return {
    user: { text: String(msg.query || '') },
    ai: {
      text: mdToHtml(raw) || 'No answer returned.',
      sources,
      sourcesMap,
      rawAnswer: raw,
      responseKind,
    },
  };
}

export function mapApiAnswerToPair(
  query: string,
  answer: string,
  sources: unknown,
  responseKind: 'answer' | 'clarification'
): ConversationPair {
  const { sources: sourcesArray, sourcesMap } = normalizeSourcesPayload(
    responseKind === 'clarification' ? null : sources
  );
  return {
    user: { text: query },
    ai: {
      text: mdToHtml(answer) || 'No answer returned.',
      sources: sourcesArray,
      sourcesMap,
      rawAnswer: answer,
      responseKind,
    },
  };
}

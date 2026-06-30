import { v4 as uuidv4 } from 'uuid';
import type { ConversationPair } from '../types/chatConversation';
import { mdToHtml } from '../utils/chatMarkdown';
import { normalizeSourcesPayload } from '../utils/chatSources';

/** Prefer server ids so history reloads keep stable keys across sessions. */
export function resolvePairId(
  msg: Record<string, unknown>,
  fallback?: string
): string {
  const fromApi =
    msg.query_id ?? msg.queryId ?? msg._id ?? msg.id ?? msg.message_id ?? msg.messageId;
  if (fromApi != null && String(fromApi).trim()) return String(fromApi);
  if (fallback?.trim()) return fallback;
  return uuidv4();
}

export function mapHistoryMessageToPair(msg: Record<string, unknown>): ConversationPair {
  const responseKind = msg.response_kind === 'clarification' ? 'clarification' : 'answer';
  const { sources, sourcesMap } = normalizeSourcesPayload(
    responseKind === 'clarification' ? null : msg.sources
  );
  const res = msg.response as Record<string, string> | undefined;
  const raw = (msg.answer as string) || res?.response || (msg.res as string) || '';
  return {
    pairId: resolvePairId(msg),
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
  responseKind: 'answer' | 'clarification',
  clarificationOptions?: string[],
  pairId?: string
): ConversationPair {
  const { sources: sourcesArray, sourcesMap } = normalizeSourcesPayload(
    responseKind === 'clarification' ? null : sources
  );
  const options =
    responseKind === 'clarification' && clarificationOptions && clarificationOptions.length > 0
      ? clarificationOptions
      : undefined;
  return {
    pairId: pairId?.trim() || uuidv4(),
    user: { text: query },
    ai: {
      text: mdToHtml(answer) || 'No answer returned.',
      sources: sourcesArray,
      sourcesMap,
      rawAnswer: answer,
      responseKind,
      clarificationOptions: options,
    },
  };
}

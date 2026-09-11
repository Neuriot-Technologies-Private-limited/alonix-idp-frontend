import { v4 as uuidv4 } from 'uuid';
import type { ConversationPair } from '../types/chatConversation';
import { mdToHtml } from './chatMarkdown';
import { normalizeSourcesPayload } from './chatSources';
import { normalizeClaimIds } from './claimChips';
import { extractClarificationOptions, resolveResponseKind } from './clarificationOptions';

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

function claimIdsFromPayload(msg: Record<string, unknown>): string[] {
  return normalizeClaimIds(msg.claim_ids ?? msg.claimIds);
}

export function mapHistoryMessageToPair(msg: Record<string, unknown>): ConversationPair {
  const responseKind = resolveResponseKind(msg);
  const { sources, sourcesMap } = normalizeSourcesPayload(
    responseKind === 'clarification' ? null : msg.sources
  );
  const res = msg.response as Record<string, string> | undefined;
  const raw = (msg.answer as string) || res?.response || (msg.res as string) || '';
  const userClaimId = String(msg.claim_id ?? msg.claimId ?? '').trim() || null;
  const clarificationOptions = extractClarificationOptions(msg);
  return {
    pairId: resolvePairId(msg),
    user: { text: String(msg.query || ''), ...(userClaimId ? { claimId: userClaimId } : {}) },
    ai: {
      text: mdToHtml(raw) || 'No answer returned.',
      sources,
      sourcesMap,
      rawAnswer: raw,
      responseKind,
      ...(clarificationOptions.length > 0 ? { clarificationOptions } : {}),
      claimIds: claimIdsFromPayload(msg),
    },
  };
}

export function mapApiAnswerToPair(
  query: string,
  answer: string,
  sources: unknown,
  responseKind: 'answer' | 'clarification',
  clarificationOptions?: string[],
  pairId?: string,
  claimMeta?: { userClaimId?: string | null; claimIds?: unknown }
): ConversationPair {
  const { sources: sourcesArray, sourcesMap } = normalizeSourcesPayload(
    responseKind === 'clarification' ? null : sources
  );
  const options =
    responseKind === 'clarification' && clarificationOptions && clarificationOptions.length > 0
      ? clarificationOptions
      : undefined;
  const userClaimId = String(claimMeta?.userClaimId || '').trim() || null;
  let claimIds = normalizeClaimIds(claimMeta?.claimIds);
  if (claimIds.length === 0 && userClaimId) claimIds = [userClaimId];
  return {
    pairId: pairId?.trim() || uuidv4(),
    user: { text: query, ...(userClaimId ? { claimId: userClaimId } : {}) },
    ai: {
      text: mdToHtml(answer) || 'No answer returned.',
      sources: sourcesArray,
      sourcesMap,
      rawAnswer: answer,
      responseKind,
      clarificationOptions: options,
      claimIds,
    },
  };
}

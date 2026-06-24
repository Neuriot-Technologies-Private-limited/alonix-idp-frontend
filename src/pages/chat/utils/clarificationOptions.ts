import type { AskResponseDto } from '../../../services/chatApi';

/** Extract clarification chip labels from API response (snake_case or camelCase). */
export function extractClarificationOptions(apiResponse: AskResponseDto): string[] {
  const raw = apiResponse.options ?? apiResponse.clarification_options ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => String(o).trim()).filter((o) => o.length > 0);
}

export function resolveResponseKind(
  apiResponse: AskResponseDto
): 'answer' | 'clarification' {
  const kind = apiResponse.response_kind ?? apiResponse.responseKind;
  return kind === 'clarification' ? 'clarification' : 'answer';
}

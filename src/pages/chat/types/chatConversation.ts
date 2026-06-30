export interface NormSource {
  title: string;
  url: string;
  page?: number;
  confidence?: number;
  file_path?: string;
  fileKey?: string;
  document?: string;
  document_id?: string;
  documentId?: string;
  source_file?: unknown;
  source_type?: string;
}

export interface ConversationPair {
  /** Stable React key — from API `query_id` when available. */
  pairId: string;
  user: { text: string };
  ai: {
    text: string;
    sources: NormSource[];
    sourcesMap: Record<string, NormSource>;
    rawAnswer: string;
    responseKind?: 'answer' | 'clarification';
    /** Live clarification turns only — not restored from history. */
    clarificationOptions?: string[];
  };
}

export interface ChatToastState {
  msg: string;
  type: 'error' | 'ok';
}

export interface ChatAlertState {
  open: boolean;
  title: string;
  msg: string;
}

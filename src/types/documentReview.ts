/** Human review types for document extraction & classification (flexible API parsing). */

export type ReviewField = {
  key: string;
  value: string;
  confidence: number | null;
  needsReview: boolean;
};

export type ExtractionReviewPage = {
  pageNumber: number;
  documentType: string;
  fields: ReviewField[];
};

export type PageClassificationRow = {
  pageNum: number;
  categoryName: string;
  categoryId?: string;
  confidence: number | null;
  needsReview: boolean;
  /** Raw row for round-trip PATCH when backend sends extra keys */
  raw?: Record<string, unknown>;
};

/** Human-friendly document group row (from classification labels). */
export type DocumentGroupRow = {
  category: string;
  confidence: number | null;
  needsReview: boolean;
  /** 1-based page numbers for display */
  pageNumbers: number[];
  raw: Record<string, unknown>;
};

export type ClassificationReviewState = {
  documentGroups: DocumentGroupRow[];
  pageClassifications: PageClassificationRow[];
  totalPages: number | null;
  extraLabels: Record<string, unknown>;
};

export type ReviewSummary = {
  extractionNeedsReview: boolean;
  classificationNeedsReview: boolean;
  extractionReviewCount: number;
  classificationReviewCount: number;
};

export type DocumentReviewPayload = {
  extractionView: { pages: ExtractionReviewPage[]; metadata: Record<string, unknown> };
  classificationView: ClassificationReviewState;
  reviewSummary: ReviewSummary;
  confidenceThreshold: number;
  extractionResult?: unknown;
  classificationData?: unknown;
};

const DEFAULT_THRESHOLD = 0.6;

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

function isHumanVerifiedFlag(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const o = raw as Record<string, unknown>;
  return o.humanVerified === true || o.reviewed === true || o.human_verified === true;
}

export function fieldNeedsReview(
  confidence: number | null,
  explicit: boolean | undefined,
  threshold: number,
  humanVerified?: boolean
): boolean {
  if (humanVerified === true) return false;
  if (explicit === true) return true;
  if (confidence == null) return true;
  return confidence < threshold;
}

function normalizePageIndices(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const nums = raw
    .map((v) => num(v))
    .filter((n): n is number => n != null && n >= 0);
  if (!nums.length) return [];
  const oneBased = nums.some((n) => n === 0);
  return [...new Set(nums.map((n) => (oneBased ? n + 1 : n)))].sort((a, b) => a - b);
}

function normalizeDocumentGroupRow(raw: unknown, threshold: number): DocumentGroupRow | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const category = raw.trim();
    if (!category) return null;
    return {
      category,
      confidence: null,
      needsReview: true,
      pageNumbers: [],
      raw: { category },
    };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const catObj =
    o.category && typeof o.category === 'object' && !Array.isArray(o.category)
      ? (o.category as Record<string, unknown>)
      : null;
  const category = str(
    pick(catObj ?? o, 'name', 'label', 'category', 'type', 'title') ?? pick(o, 'category') ?? ''
  ).trim();
  if (!category) return null;
  const confidence = num(
    pick(o, 'confidence', 'score', 'conf') ?? (catObj ? pick(catObj, 'confidence', 'score') : undefined)
  );
  const pageNumbers = normalizePageIndices(pick(o, 'pages', 'page_numbers', 'pageNumbers'));
  const needsReview = fieldNeedsReview(
    confidence,
    pick<boolean>(o, 'needsReview', 'needs_review'),
    threshold,
    isHumanVerifiedFlag(o)
  );
  return {
    category,
    confidence,
    needsReview,
    pageNumbers,
    raw: { ...o },
  };
}

/** Turn API keys like `foo_bar` into readable labels. */
export function humanizeLabelKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatExtraLabelValue(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    return v.map((item) => formatExtraLabelValue(item)).join(', ');
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length <= 4) {
      return entries.map(([k, val]) => `${humanizeLabelKey(k)}: ${formatExtraLabelValue(val)}`).join(' · ');
    }
  }
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function formatPageNumberList(pages: number[]): string {
  if (!pages.length) return 'All pages';
  if (pages.length <= 5) return `Pages ${pages.join(', ')}`;
  return `Pages ${pages.slice(0, 4).join(', ')} +${pages.length - 4} more`;
}

function normalizeReviewField(raw: unknown, threshold: number): ReviewField | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const key = str(pick(o, 'key', 'field', 'name', 'label') ?? '');
  if (!key) return null;
  const confidence = num(pick(o, 'confidence', 'score', 'conf'));
  const needsReview = fieldNeedsReview(
    confidence,
    pick<boolean>(o, 'needsReview', 'needs_review'),
    threshold,
    isHumanVerifiedFlag(o)
  );
  return {
    key,
    value: str(pick(o, 'value', 'val', 'text')),
    confidence,
    needsReview,
  };
}

function pageNumberFrom(raw: Record<string, unknown>, idx: number): number {
  const n = num(
    pick(raw, 'pageNumber', 'page_number', 'page_num', 'page', 'pageIndex', 'index')
  );
  return n != null && n > 0 ? n : idx + 1;
}

function fieldsFromKeyValuePairs(kv: unknown, threshold: number): ReviewField[] {
  if (!kv || typeof kv !== 'object' || Array.isArray(kv)) return [];
  const out: ReviewField[] = [];
  for (const [key, val] of Object.entries(kv as Record<string, unknown>)) {
    let value = '';
    let confidence: number | null = null;
    let humanVerified = false;
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      const vo = val as Record<string, unknown>;
      value = str(pick(vo, 'value', 'val', 'text') ?? val);
      confidence = num(pick(vo, 'confidence', 'score', 'conf'));
      humanVerified = isHumanVerifiedFlag(vo);
    } else {
      value = str(val);
    }
    out.push({
      key: String(key),
      value,
      confidence,
      needsReview: fieldNeedsReview(confidence, undefined, threshold, humanVerified),
    });
  }
  return out;
}

export function normalizeExtractionPages(
  source: unknown,
  threshold = DEFAULT_THRESHOLD
): ExtractionReviewPage[] {
  if (!source || typeof source !== 'object') return [];
  const root = source as Record<string, unknown>;
  const pagesRaw =
    pick<unknown[]>(root, 'pages') ??
    (Array.isArray(source) ? (source as unknown[]) : null);
  if (!pagesRaw?.length) return [];

  return pagesRaw.map((page, idx) => {
    const p =
      page && typeof page === 'object' && !Array.isArray(page)
        ? (page as Record<string, unknown>)
        : {};
    const pageNumber = pageNumberFrom(p, idx);
    const documentType = str(
      pick(p, 'documentType', 'document_type', 'doc_type', 'type') ?? ''
    );

    let fields: ReviewField[] = [];
    const fieldsRaw = pick<unknown[]>(p, 'fields');
    if (fieldsRaw?.length) {
      fields = fieldsRaw
        .map((f) => normalizeReviewField(f, threshold))
        .filter((f): f is ReviewField => f != null);
    }
    if (!fields.length) {
      const kv =
        pick(p, 'key_value_pairs') ??
        pick(p, 'keyValuePairs') ??
        (p.page_content && typeof p.page_content === 'object'
          ? pick(p.page_content as Record<string, unknown>, 'key_value_pairs')
          : undefined);
      fields = fieldsFromKeyValuePairs(kv, threshold);
    }

    return { pageNumber, documentType, fields };
  });
}

export function normalizeClassification(
  source: unknown,
  threshold = DEFAULT_THRESHOLD
): ClassificationReviewState {
  const empty: ClassificationReviewState = {
    documentGroups: [],
    pageClassifications: [],
    totalPages: null,
    extraLabels: {},
  };
  if (!source || typeof source !== 'object') return empty;

  let root = source as Record<string, unknown>;
  if (root.labels && typeof root.labels === 'object' && !Array.isArray(root.labels)) {
    root = root.labels as Record<string, unknown>;
  }
  if (root.classificationView && typeof root.classificationView === 'object') {
    root = root.classificationView as Record<string, unknown>;
  }

  const documentGroupsRaw =
    (pick<unknown[]>(root, 'documentGroups', 'document_groups') as unknown[]) ?? [];
  const documentGroups = documentGroupsRaw
    .map((g) => normalizeDocumentGroupRow(g, threshold))
    .filter((g): g is DocumentGroupRow => g != null);

  const pageRaw =
    pick<unknown[]>(root, 'pageClassifications', 'page_classifications') ?? [];

  const pageClassifications: PageClassificationRow[] = pageRaw.map((row, i) => {
    const r =
      row && typeof row === 'object' && !Array.isArray(row)
        ? (row as Record<string, unknown>)
        : {};
    const pageNum =
      num(pick(r, 'pageNum', 'page_num', 'page_number', 'page')) ?? i + 1;
    const cat =
      r.category && typeof r.category === 'object' && !Array.isArray(r.category)
        ? (r.category as Record<string, unknown>)
        : {};
    const categoryName = str(
      pick(cat, 'name', 'label', 'category') ??
        pick(r, 'categoryName', 'category_name', 'label', 'name') ??
        ''
    );
    const categoryId = str(pick(cat, 'id', 'category_id') ?? pick(r, 'category_id', 'id'));
    const confidence = num(
      pick(r, 'confidence', 'score', 'conf') ?? pick(cat, 'confidence', 'score')
    );
    const needsReview = fieldNeedsReview(
      confidence,
      pick<boolean>(r, 'needsReview', 'needs_review'),
      threshold,
      isHumanVerifiedFlag(r) || isHumanVerifiedFlag(cat)
    );
    return {
      pageNum,
      categoryName,
      categoryId: categoryId || undefined,
      confidence,
      needsReview,
      raw: r,
    };
  });

  const totalPages = num(pick(root, 'totalPages', 'total_pages'));

  const reserved = new Set([
    'document_groups',
    'documentGroups',
    'page_classifications',
    'pageClassifications',
    'total_pages',
    'totalPages',
  ]);
  const extraLabels: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(root)) {
    if (!reserved.has(k)) extraLabels[k] = v;
  }

  return { documentGroups, pageClassifications, totalPages, extraLabels };
}

function normalizeReviewSummary(raw: unknown): ReviewSummary {
  const d =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const extraction =
    d.extraction && typeof d.extraction === 'object' && !Array.isArray(d.extraction)
      ? (d.extraction as Record<string, unknown>)
      : null;
  const classification =
    d.classification && typeof d.classification === 'object' && !Array.isArray(d.classification)
      ? (d.classification as Record<string, unknown>)
      : null;

  return {
    extractionNeedsReview: Boolean(
      pick(d, 'extractionNeedsReview', 'extraction_needs_review') ??
        pick<boolean>(extraction ?? {}, 'needsReview', 'needs_review')
    ),
    classificationNeedsReview: Boolean(
      pick(d, 'classificationNeedsReview', 'classification_needs_review') ??
        pick<boolean>(classification ?? {}, 'needsReview', 'needs_review')
    ),
    extractionReviewCount:
      num(pick(d, 'extractionReviewCount', 'extraction_review_count')) ??
      num(pick(extraction ?? {}, 'lowConfidenceCount', 'low_confidence_count')) ??
      0,
    classificationReviewCount:
      num(pick(d, 'classificationReviewCount', 'classification_review_count')) ??
      num(pick(classification ?? {}, 'lowConfidenceCount', 'low_confidence_count')) ??
      0,
  };
}

export function countExtractionReviewItems(pages: ExtractionReviewPage[]): number {
  return pages.reduce((n, p) => n + p.fields.filter((f) => f.needsReview).length, 0);
}

export function countClassificationReviewItems(state: ClassificationReviewState): number {
  return (
    state.pageClassifications.filter((r) => r.needsReview).length +
    state.documentGroups.filter((g) => g.needsReview).length
  );
}

function fieldWasReviewable(initial: ReviewField | undefined): boolean {
  return initial?.needsReview === true;
}

/** PATCH only pages/fields that were below threshold at open and changed (or still reviewable). */
export function extractionReviewPatchBody(
  pages: ExtractionReviewPage[],
  initialPages?: ExtractionReviewPage[]
) {
  const initialByPage = new Map(
    (initialPages ?? []).map((p) => [p.pageNumber, p] as const)
  );

  const outPages: {
    pageNumber: number;
    keyValuePairs: Record<string, { value: string | null; confidence?: number | null }>;
  }[] = [];

  for (const p of pages) {
    const initPage = initialByPage.get(p.pageNumber);
    const initByKey = new Map((initPage?.fields ?? []).map((f) => [f.key, f] as const));
    const keyValuePairs: Record<string, { value: string | null; confidence?: number | null }> = {};

    for (const f of p.fields) {
      const init = initByKey.get(f.key);
      if (initialPages && !fieldWasReviewable(init)) continue;
      if (initialPages && init && f.value === init.value) continue;
      keyValuePairs[f.key] = {
        value: f.value === '' ? null : f.value,
        confidence: f.confidence,
      };
    }

    if (Object.keys(keyValuePairs).length > 0) {
      outPages.push({ pageNumber: p.pageNumber, keyValuePairs });
    }
  }

  return { pages: outPages };
}

/** Build PATCH body for classification review (only changed reviewable items when initial provided). */
export function classificationReviewPatchBody(
  state: ClassificationReviewState,
  initial?: ClassificationReviewState
) {
  const page_classifications = state.pageClassifications
    .map((row, idx) => {
      const init = initial?.pageClassifications[idx];
      if (initial && !init?.needsReview) return null;
      if (initial && init && row.categoryName === init.categoryName) return null;
      const base: Record<string, unknown> = { ...(row.raw ?? {}) };
      base.page_num = row.pageNum;
      base.page_number = row.pageNum;
      const cat: Record<string, unknown> =
        base.category && typeof base.category === 'object' && !Array.isArray(base.category)
          ? { ...(base.category as Record<string, unknown>) }
          : {};
      cat.name = row.categoryName;
      if (row.categoryId) cat.id = row.categoryId;
      if (row.confidence != null) {
        base.confidence = row.confidence;
        cat.confidence = row.confidence;
      }
      base.needs_review = row.needsReview;
      if (!cat.name && row.categoryName) {
        base.category = {
          name: row.categoryName,
          ...(row.categoryId ? { id: row.categoryId } : {}),
        };
      } else {
        base.category = cat;
      }
      return base;
    })
    .filter((row): row is Record<string, unknown> => row != null);

  const document_groups = state.documentGroups
    .map((group, idx) => {
      const init = initial?.documentGroups[idx];
      if (initial && !init?.needsReview) return null;
      if (initial && init && group.category === init.category) return null;
      const raw = { ...group.raw };
      raw.category = group.category;
      if (group.confidence != null) raw.confidence = group.confidence;
      if (group.pageNumbers.length) raw.pages = group.pageNumbers.map((n) => n - 1);
      return raw;
    })
    .filter((g): g is Record<string, unknown> => g != null);

  const labels: Record<string, unknown> = { ...state.extraLabels };
  if (document_groups.length) labels.document_groups = document_groups;
  if (page_classifications.length) labels.page_classifications = page_classifications;

  return { labels };
}

/** Parse GET /results (or embedded doc row) into review payload. */
export function parseDocumentReviewResults(data: unknown): DocumentReviewPayload {
  const root =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const threshold =
    num(pick(root, 'confidenceThreshold', 'confidence_threshold')) ?? DEFAULT_THRESHOLD;

  const extractionViewRaw =
    pick<Record<string, unknown>>(root, 'extractionView', 'extraction_view') ?? null;
  const extractionSource =
    extractionViewRaw ??
    pick(root, 'extractionResult', 'extractedData', 'extraction_result') ??
    null;

  const classificationViewRaw =
    pick<Record<string, unknown>>(root, 'classificationView', 'classification_view') ?? null;
  const classificationSource =
    classificationViewRaw ??
    pick(root, 'classificationData', 'classification_data') ??
    null;

  const extractionPages = normalizeExtractionPages(
    extractionViewRaw ?? extractionSource,
    threshold
  );
  const classificationView = normalizeClassification(
    classificationViewRaw ?? classificationSource,
    threshold
  );

  let reviewSummary = normalizeReviewSummary(
    pick(root, 'reviewSummary', 'review_summary')
  );
  const extCount = countExtractionReviewItems(extractionPages);
  const clsCount = countClassificationReviewItems(classificationView);
  if (!reviewSummary.extractionReviewCount && extCount) {
    reviewSummary = {
      ...reviewSummary,
      extractionReviewCount: extCount,
      extractionNeedsReview: extCount > 0,
    };
  }
  if (!reviewSummary.classificationReviewCount && clsCount) {
    reviewSummary = {
      ...reviewSummary,
      classificationReviewCount: clsCount,
      classificationNeedsReview: clsCount > 0,
    };
  }

  return {
    extractionView: {
      pages: extractionPages,
      metadata:
        extractionViewRaw && typeof extractionViewRaw.metadata === 'object'
          ? (extractionViewRaw.metadata as Record<string, unknown>)
          : {},
    },
    classificationView,
    reviewSummary,
    confidenceThreshold: threshold,
    extractionResult: pick(root, 'extractionResult', 'extractedData'),
    classificationData: pick(root, 'classificationData', 'classification_data'),
  };
}

export function cloneExtractionPages(pages: ExtractionReviewPage[]): ExtractionReviewPage[] {
  return pages.map((p) => ({
    ...p,
    fields: p.fields.map((f) => ({ ...f })),
  }));
}

export function cloneClassificationState(
  state: ClassificationReviewState
): ClassificationReviewState {
  return {
    documentGroups: state.documentGroups.map((g) => ({
      ...g,
      pageNumbers: [...g.pageNumbers],
      raw: { ...g.raw },
    })),
    pageClassifications: state.pageClassifications.map((r) => ({
      ...r,
      raw: r.raw ? { ...r.raw } : undefined,
    })),
    totalPages: state.totalPages,
    extraLabels: { ...state.extraLabels },
  };
}

/** Whether user changed any reviewable extraction/classification fields. */
export function hasReviewableExtractionChanges(
  current: ExtractionReviewPage[],
  initial: ExtractionReviewPage[]
): boolean {
  return extractionReviewPatchBody(current, initial).pages.length > 0;
}

export function hasReviewableClassificationChanges(
  current: ClassificationReviewState,
  initial: ClassificationReviewState
): boolean {
  const body = classificationReviewPatchBody(current, initial);
  const labels = body.labels as Record<string, unknown>;
  return Boolean(
    (Array.isArray(labels.document_groups) && labels.document_groups.length) ||
      (Array.isArray(labels.page_classifications) && labels.page_classifications.length)
  );
}

import { describe, expect, it } from 'vitest';
import {
  parseDocumentReviewResults,
  normalizeExtractionPages,
  normalizeClassification,
  extractionReviewPatchBody,
  classificationReviewPatchBody,
  hasReviewableExtractionChanges,
  humanizeLabelKey,
  formatPageNumberList,
} from '../types/documentReview';

describe('documentReview parsing', () => {
  it('parses extractionView pages with fields', () => {
    const payload = parseDocumentReviewResults({
      extractionView: {
        pages: [
          {
            pageNumber: 1,
            documentType: 'invoice',
            fields: [
              { key: 'total', value: '100', confidence: 0.4, needsReview: true },
            ],
          },
        ],
      },
      confidenceThreshold: 0.6,
      reviewSummary: { extractionReviewCount: 1, extractionNeedsReview: true },
    });
    expect(payload.extractionView.pages).toHaveLength(1);
    expect(payload.extractionView.pages[0].fields[0].needsReview).toBe(true);
  });

  it('normalizes legacy key_value_pairs extraction', () => {
    const pages = normalizeExtractionPages({
      pages: [{ page_number: 2, key_value_pairs: { vendor: 'Acme' } }],
    });
    expect(pages[0].pageNumber).toBe(2);
    expect(pages[0].fields.some((f) => f.key === 'vendor')).toBe(true);
  });

  it('normalizes document groups for friendly UI', () => {
    const cls = normalizeClassification({
      labels: {
        document_groups: [
          { category: 'Invoice', confidence: 0.4, pages: [0, 1] },
          { category: 'Contract', confidence: 0.9, pages: [2] },
        ],
        page_classifications: [{ page_num: 1, category: { name: 'Cover' }, confidence: 0.5 }],
        total_pages: 3,
      },
    });
    expect(cls.documentGroups).toHaveLength(2);
    expect(cls.documentGroups[0].category).toBe('Invoice');
    expect(cls.documentGroups[0].needsReview).toBe(true);
    expect(cls.documentGroups[0].pageNumbers).toEqual([1, 2]);
    expect(cls.documentGroups[1].needsReview).toBe(false);
    expect(cls.pageClassifications[0].categoryName).toBe('Cover');
  });

  it('builds extraction PATCH only for changed low-confidence fields', () => {
    const initial = [
      {
        pageNumber: 1,
        documentType: 'invoice',
        fields: [
          { key: 'total', value: '100', confidence: 0.4, needsReview: true },
          { key: 'vendor', value: 'Acme', confidence: 0.95, needsReview: false },
        ],
      },
    ];
    const current = [
      {
        pageNumber: 1,
        documentType: 'invoice',
        fields: [
          { key: 'total', value: '101', confidence: 1, needsReview: false },
          { key: 'vendor', value: 'Acme', confidence: 0.95, needsReview: false },
        ],
      },
    ];
    const body = extractionReviewPatchBody(current, initial);
    expect(body.pages).toHaveLength(1);
    expect(body.pages[0].keyValuePairs).toEqual({ total: { value: '101', confidence: 1 } });
    expect(hasReviewableExtractionChanges(current, initial)).toBe(true);
  });

  it('classification PATCH omits unchanged high-confidence rows', () => {
    const initial = normalizeClassification({
      labels: {
        document_groups: [{ category: 'Bill', confidence: 0.9, pages: [0] }],
        page_classifications: [
          { page_num: 1, category: { name: 'Low' }, confidence: 0.3 },
          { page_num: 2, category: { name: 'High' }, confidence: 0.95 },
        ],
      },
    });
    const current = {
      ...initial,
      pageClassifications: initial.pageClassifications.map((r, i) =>
        i === 0 ? { ...r, categoryName: 'Fixed', needsReview: false } : r
      ),
    };
    const body = classificationReviewPatchBody(current, initial);
    const labels = body.labels as Record<string, unknown>;
    expect(labels.document_groups).toBeUndefined();
    expect(Array.isArray(labels.page_classifications)).toBe(true);
    expect((labels.page_classifications as unknown[]).length).toBe(1);
  });

  it('humanizes label keys and page lists', () => {
    expect(humanizeLabelKey('total_pages')).toBe('Total Pages');
    expect(formatPageNumberList([1, 2, 3])).toBe('Pages 1, 2, 3');
  });

  it('parses nested backend reviewSummary', () => {
    const payload = parseDocumentReviewResults({
      extractionView: { pages: [] },
      classificationView: { pageClassifications: [] },
      reviewSummary: {
        extraction: { needsReview: true, lowConfidenceCount: 3 },
        classification: { needsReview: false, lowConfidenceCount: 0 },
      },
    });
    expect(payload.reviewSummary.extractionNeedsReview).toBe(true);
    expect(payload.reviewSummary.extractionReviewCount).toBe(3);
    expect(payload.reviewSummary.classificationNeedsReview).toBe(false);
  });

  it('does not flag humanVerified fields for review', () => {
    const pages = normalizeExtractionPages({
      pages: [
        {
          pageNumber: 1,
          fields: [{ key: 'done', value: 'x', confidence: 0.1, humanVerified: true }],
        },
      ],
    });
    expect(pages[0].fields[0].needsReview).toBe(false);
  });
});

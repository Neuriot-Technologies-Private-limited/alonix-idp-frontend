import { describe, expect, it } from 'vitest';
import { isAllowedExternalDocumentUrl } from '../utils/safeDocumentUrl';

describe('isAllowedExternalDocumentUrl', () => {
  it('allows HTTPS S3 presigned URLs', () => {
    expect(
      isAllowedExternalDocumentUrl('https://my-bucket.s3.us-east-1.amazonaws.com/doc.pdf')
    ).toBe(true);
  });

  it('blocks arbitrary external HTTPS URLs', () => {
    expect(isAllowedExternalDocumentUrl('https://evil.example.com/steal')).toBe(false);
  });

  it('blocks javascript URLs', () => {
    expect(isAllowedExternalDocumentUrl('javascript:alert(1)')).toBe(false);
  });

  it('blocks plain HTTP', () => {
    expect(isAllowedExternalDocumentUrl('http://my-bucket.s3.amazonaws.com/doc.pdf')).toBe(false);
  });
});

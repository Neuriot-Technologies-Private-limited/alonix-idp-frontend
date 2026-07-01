/**
 * API server configuration for the interactive playground.
 * Values come from docusaurus.config.ts customFields (set via DOCUSAURUS_API_* at build time).
 */
export type ApiMode = 'mock' | 'sandbox';

export interface ApiConfig {
  mode: ApiMode;
  mockUrl: string;
  sandboxUrl: string;
  activeServerUrl: string;
  openApiUrl: string;
}

export type ApiCustomFields = {
  apiMode?: string;
  mockUrl?: string;
  sandboxUrl?: string;
};

/** Same-origin mock base — resolved in playground iframe at runtime. */
export const BROWSER_MOCK_URL = '/mock-api';

const DEFAULT_MOCK_URL = BROWSER_MOCK_URL;
const DEFAULT_SANDBOX_URL = 'http://localhost:5005/api';

export function buildApiConfig(fields?: ApiCustomFields): ApiConfig {
  const mode: ApiMode = fields?.apiMode === 'sandbox' ? 'sandbox' : 'mock';
  const mockUrl = fields?.mockUrl ?? DEFAULT_MOCK_URL;
  const sandboxUrl = fields?.sandboxUrl ?? DEFAULT_SANDBOX_URL;

  return {
    mode,
    mockUrl,
    sandboxUrl,
    activeServerUrl: mode === 'sandbox' ? sandboxUrl : mockUrl,
    openApiUrl: '/openapi.yaml',
  };
}

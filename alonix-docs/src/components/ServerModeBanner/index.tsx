import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

type CustomFields = {
  apiMode?: string;
  mockUrl?: string;
  sandboxUrl?: string;
};

export default function ServerModeBanner(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const fields = (siteConfig.customFields ?? {}) as CustomFields;
  const mode = fields.apiMode ?? 'mock';
  const isMock = mode === 'mock';

  return (
    <div
      className={styles.banner}
      data-mode={mode}
      role="status"
      aria-label={`API mode: ${mode}`}>
      <span className={styles.badge}>{isMock ? 'Mock' : 'Sandbox'}</span>
      <span className={styles.text}>
        {isMock ? (
          <>
            Responses come from <strong>OpenAPI examples in your browser</strong> — no live server
            required. Credentials are not checked; data is for demos only. Safe on deployed docs.
          </>
        ) : (
          <>
            Requests go to the <strong>sandbox backend</strong> at{' '}
            <code>{fields.sandboxUrl ?? 'http://localhost:5005/api'}</code>. Use non-production
            credentials only. Rate limit: 100 req / 15 min per IP.
          </>
        )}
      </span>
    </div>
  );
}

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
            Requests go to the <strong>Prism mock server</strong> at{' '}
            <code>{fields.mockUrl ?? 'http://localhost:4010'}</code> — responses are{' '}
            <strong>example data only</strong> (your credentials are not checked). Safe for demos.
            For real API responses, switch the server dropdown in the playground to{' '}
            <strong>Sandbox backend</strong> and run the backend on{' '}
            <code>{fields.sandboxUrl ?? 'http://localhost:5005/api'}</code>, or set{' '}
            <code>DOCUSAURUS_API_MODE=sandbox</code> in <code>.env</code> and restart docs.
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

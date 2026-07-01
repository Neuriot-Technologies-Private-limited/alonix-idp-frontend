import React, {useMemo} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';
import {buildApiConfig, type ApiCustomFields} from '@site/src/config/api';
import {useBrand} from '@site/src/brand/useBrand';
import styles from './styles.module.css';

function PlaygroundFrame(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const brand = useBrand();
  const location = useLocation();
  const fields = (siteConfig.customFields ?? {}) as ApiCustomFields;
  const playgroundHtml = useBaseUrl('/playground/index.html');
  const openApiUrl = useBaseUrl('/openapi.yaml');

  const iframeSrc = useMemo(() => {
    const api = buildApiConfig(fields);
    api.openApiUrl = openApiUrl;

    const params = new URLSearchParams({
      spec: api.openApiUrl,
      server: api.activeServerUrl,
      mode: api.mode,
      mockUrl: api.mockUrl,
      sandboxUrl: api.sandboxUrl,
    });

    const search = new URLSearchParams(location.search);
    const opPath = search.get('path');
    const opMethod = search.get('method');
    if (opPath) params.set('path', opPath);
    if (opMethod) params.set('method', opMethod);

    return `${playgroundHtml}?${params.toString()}`;
  }, [fields, location.search, openApiUrl, playgroundHtml]);

  return (
    <iframe
      title={`${brand.name} API Playground`}
      className={styles.frame}
      src={iframeSrc}
      allow="clipboard-write"
    />
  );
}

export default function ApiPlayground(): React.JSX.Element {
  return (
    <div className={styles.wrapper}>
      <BrowserOnly fallback={<p className={styles.loading}>Loading API playground…</p>}>
        {() => <PlaygroundFrame />}
      </BrowserOnly>
    </div>
  );
}

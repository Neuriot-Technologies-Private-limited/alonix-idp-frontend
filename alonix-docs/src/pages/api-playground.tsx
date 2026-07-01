import React from 'react';
import Layout from '@theme/Layout';
import ServerModeBanner from '@site/src/components/ServerModeBanner';
import ApiPlayground from '@site/src/components/ApiPlayground';

export default function ApiPlaygroundPage(): React.JSX.Element {
  return (
    <Layout
      title="API Playground"
      description="Interactive Alonix IDP API reference — try endpoints in the browser with mock or sandbox backends."
      noFooter>
      <main className="api-playground-page">
        <ServerModeBanner />
        <ApiPlayground />
      </main>
    </Layout>
  );
}

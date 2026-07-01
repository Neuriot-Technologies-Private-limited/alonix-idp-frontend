import React from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

export interface CodeTabsProps {
  curl: string;
  fetch: string;
  title?: string;
}

export default function CodeTabs({curl, fetch, title}: CodeTabsProps): React.JSX.Element {
  return (
    <Tabs groupId="code-examples" queryString>
      {title ? (
        <TabItem value={title.toLowerCase()} label={title} default>
          <pre>
            <code>{curl}</code>
          </pre>
        </TabItem>
      ) : null}
      <TabItem value="curl" label="cURL" default={!title}>
        <pre>
          <code>{curl}</code>
        </pre>
      </TabItem>
      <TabItem value="fetch" label="JavaScript (fetch)">
        <pre>
          <code>{fetch}</code>
        </pre>
      </TabItem>
    </Tabs>
  );
}

import React from 'react';
import Link from '@docusaurus/Link';
import {useSitePath} from '@site/src/utils/sitePath';

type PlaygroundLinkProps = {
  path: string;
  method: string;
  label?: string;
};

export default function PlaygroundLink({
  path,
  method,
  label = 'Open this operation in API Playground',
}: PlaygroundLinkProps): React.JSX.Element {
  const sp = useSitePath();
  const params = new URLSearchParams({
    path,
    method: method.toLowerCase(),
  });
  return (
    <p>
      <Link className="button button--primary button--sm" to={sp(`/api-playground?${params.toString()}`)}>
        {label}
      </Link>
    </p>
  );
}

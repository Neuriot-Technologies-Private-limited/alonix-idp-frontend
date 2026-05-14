/**
 * @deprecated Standalone connector route redirects to Documents with the connector modal.
 * Use `ConnectorBrowserContent` from `components/connectors` or open `/documents?connectors=1`.
 */
import { Navigate, useLocation } from 'react-router-dom';

const ConnectorBrowserPage = () => {
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const cid = sp.get('connectorId');
  const next = new URLSearchParams();
  next.set('connectors', '1');
  if (cid) next.set('connectorId', cid);
  return <Navigate to={`/documents?${next.toString()}`} replace />;
};

export default ConnectorBrowserPage;

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {DocsBrandConfig} from './types';

export function useBrand(): DocsBrandConfig {
  const {siteConfig} = useDocusaurusContext();
  return siteConfig.customFields?.brand as DocsBrandConfig;
}

/**
 * Build-time deployment profile (SaaS vs enterprise).
 * Source of truth: VITE_DEPLOYMENT_PROFILE in `.env` (must match backend DEPLOYMENT_PROFILE).
 */

import {
  normalizeDeploymentProfile,
  type DeploymentProfile,
} from './resolveDeploymentProfile';

export type { DeploymentProfile };
export {
  normalizeDeploymentProfile,
  resolveDeploymentProfileFromEnv,
} from './resolveDeploymentProfile';

export const deploymentProfile: DeploymentProfile = normalizeDeploymentProfile(
  import.meta.env.VITE_DEPLOYMENT_PROFILE
);

export function isEnterpriseBuild(): boolean {
  return deploymentProfile === 'enterprise';
}

export function isSaasBuild(): boolean {
  return !isEnterpriseBuild();
}

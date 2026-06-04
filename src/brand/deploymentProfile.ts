/**
 * Build-time deployment profile (SaaS vs enterprise).
 * Set via VITE_DEPLOYMENT_PROFILE in vite / npm scripts.
 */

export type DeploymentProfile = 'saas' | 'enterprise';

function normalize(raw: unknown): DeploymentProfile {
  const v = String(raw || 'saas').trim().toLowerCase();
  return v === 'enterprise' ? 'enterprise' : 'saas';
}

export const deploymentProfile: DeploymentProfile = normalize(
  import.meta.env.VITE_DEPLOYMENT_PROFILE
);

export function isEnterpriseBuild(): boolean {
  return deploymentProfile === 'enterprise';
}

export function isSaasBuild(): boolean {
  return !isEnterpriseBuild();
}

/**
 * Shared SaaS vs enterprise profile parsing.
 * Used by Vite (Node) and by the browser bundle. Do not read import.meta.env here.
 */

export type DeploymentProfile = 'saas' | 'enterprise';

export function normalizeDeploymentProfile(raw: unknown): DeploymentProfile {
  const v = String(raw || '').trim().toLowerCase();
  return v === 'saas' ? 'saas' : 'enterprise';
}

/**
 * `.env` / Vite loaded env wins over npm-script process.env, so local and CI
 * follow the env file. Scripts (`dev:saas`) apply only when the file omits the var.
 */
export function resolveDeploymentProfileFromEnv(
  fileEnv: Record<string, string | undefined>,
  processEnv: Record<string, string | undefined> = {}
): DeploymentProfile {
  const fromFile = String(fileEnv.VITE_DEPLOYMENT_PROFILE || '').trim();
  const fromProcess = String(processEnv.VITE_DEPLOYMENT_PROFILE || '').trim();
  return normalizeDeploymentProfile(fromFile || fromProcess || 'enterprise');
}

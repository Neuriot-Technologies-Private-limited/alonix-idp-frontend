import { describe, it, expect, vi, afterEach } from 'vitest';

describe('deploymentProfile', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadProfile() {
    return import('../brand/deploymentProfile');
  }

  it('defaults to enterprise when VITE_DEPLOYMENT_PROFILE is unset', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', '');
    const { deploymentProfile, isSaasBuild, isEnterpriseBuild } = await loadProfile();
    expect(deploymentProfile).toBe('enterprise');
    expect(isSaasBuild()).toBe(false);
    expect(isEnterpriseBuild()).toBe(true);
  });

  it('recognizes saas profile', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'saas');
    const { deploymentProfile, isEnterpriseBuild, isSaasBuild } = await loadProfile();
    expect(deploymentProfile).toBe('saas');
    expect(isEnterpriseBuild()).toBe(false);
    expect(isSaasBuild()).toBe(true);
  });

  it('recognizes enterprise profile', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'enterprise');
    const { deploymentProfile, isEnterpriseBuild, isSaasBuild } = await loadProfile();
    expect(deploymentProfile).toBe('enterprise');
    expect(isEnterpriseBuild()).toBe(true);
    expect(isSaasBuild()).toBe(false);
  });

  it('treats unknown values as enterprise', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'staging');
    const { deploymentProfile, isEnterpriseBuild } = await loadProfile();
    expect(deploymentProfile).toBe('enterprise');
    expect(isEnterpriseBuild()).toBe(true);
  });

  it('prefers .env over process.env for the deployment profile', async () => {
    const { resolveDeploymentProfileFromEnv } = await loadProfile();
    expect(
      resolveDeploymentProfileFromEnv(
        { VITE_DEPLOYMENT_PROFILE: 'saas' },
        { VITE_DEPLOYMENT_PROFILE: 'enterprise' }
      )
    ).toBe('saas');
    expect(
      resolveDeploymentProfileFromEnv({}, { VITE_DEPLOYMENT_PROFILE: 'saas' })
    ).toBe('saas');
    expect(resolveDeploymentProfileFromEnv({}, {})).toBe('enterprise');
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';

describe('deploymentProfile', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadProfile() {
    return import('../brand/deploymentProfile');
  }

  it('defaults to saas when VITE_DEPLOYMENT_PROFILE is unset', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', '');
    const { deploymentProfile, isSaasBuild, isEnterpriseBuild } = await loadProfile();
    expect(deploymentProfile).toBe('saas');
    expect(isSaasBuild()).toBe(true);
    expect(isEnterpriseBuild()).toBe(false);
  });

  it('recognizes enterprise profile', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'enterprise');
    const { deploymentProfile, isEnterpriseBuild, isSaasBuild } = await loadProfile();
    expect(deploymentProfile).toBe('enterprise');
    expect(isEnterpriseBuild()).toBe(true);
    expect(isSaasBuild()).toBe(false);
  });

  it('treats unknown values as saas', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_PROFILE', 'staging');
    const { deploymentProfile, isEnterpriseBuild } = await loadProfile();
    expect(deploymentProfile).toBe('saas');
    expect(isEnterpriseBuild()).toBe(false);
  });
});

/**
 * Client-side AES-GCM wrap for mailbox credentials.
 * Plain app passwords never appear in request JSON — only wrapKeyId + ciphertext.
 */
import apiClient from './api/client';
import { useAuthStore } from '../stores/authStore';

function resolveOrgId(): string {
  const state = useAuthStore.getState();
  return state.context?.orgId || state.user?.orgId || '';
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export interface WrappedCredentialPayload {
  wrapKeyId: string;
  wrappedPassword: string;
}

export async function wrapMailboxCredential(password: string): Promise<WrappedCredentialPayload> {
  const orgId = resolveOrgId();
  const { data } = await apiClient.post<{ wrapKeyId: string; key: string }>(
    `/admin/orgs/${orgId}/connectors/credential-wrap-key`,
    {}
  );

  const keyBytes = base64ToBytes(data.key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBytes = new TextEncoder().encode(password);

  const keyMaterial = new Uint8Array(keyBytes);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const cipherWithTag = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plainBytes)
  );

  const tagLen = 16;
  const ciphertext = cipherWithTag.slice(0, cipherWithTag.length - tagLen);
  const tag = cipherWithTag.slice(cipherWithTag.length - tagLen);

  return {
    wrapKeyId: data.wrapKeyId,
    wrappedPassword: `${bytesToBase64(iv)}.${bytesToBase64(ciphertext)}.${bytesToBase64(tag)}`,
  };
}

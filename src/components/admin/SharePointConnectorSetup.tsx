import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, Loader2, Shield } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useOrgSharePointSettings } from '../../hooks/queries/admin';
import { cn } from '../../utils/cn';

const AZURE_SETUP_STEPS = [
  'Open Azure Entra ID → App registrations → New registration (or select your existing app).',
  'Under Authentication, add the redirect URI below (exact match required).',
  'Add Microsoft Graph Application permissions: Sites.Read.All and Files.Read.All.',
  'Grant admin consent for your organization.',
  'Create a client secret and copy the Value (not the Secret ID).',
  'Paste Client ID and secret here, then save.',
];

type SharePointConnectorSetupProps = {
  fallbackRedirectUri?: string;
  onSaved?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
};

export const SharePointConnectorSetup: React.FC<SharePointConnectorSetupProps> = ({
  fallbackRedirectUri,
  onSaved,
  onCancel,
  showCancel = false,
}) => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useOrgSharePointSettings();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setClientId(settings.clientId || '');
    setClientSecret('');
  }, [settings]);

  const redirectUri = settings?.redirectUri || fallbackRedirectUri || '';

  const copyRedirectUri = async () => {
    if (!redirectUri) return;
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus('Could not copy redirect URI. Select and copy it manually.');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setStatus('');
    try {
      const payload: { clientId?: string; clientSecret?: string } = {};
      if (clientId.trim()) payload.clientId = clientId.trim();
      if (clientSecret.trim()) payload.clientSecret = clientSecret.trim();
      await adminService.updateOrgSharePointSettings(payload);
      setClientSecret('');
      setStatus('Azure app saved. You can now connect with Microsoft.');
      await queryClient.invalidateQueries({ queryKey: ['org-sharepoint-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['sharepoint-oauth-config'] });
      onSaved?.();
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setStatus(e2.response?.data?.message || 'Failed to save Azure app settings.');
    } finally {
      setSaving(false);
    }
  };

  const testSettings = async () => {
    setTesting(true);
    setStatus('');
    try {
      const result = await adminService.testOrgSharePointSettings();
      setStatus(result.message || 'Credentials verified with Microsoft.');
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setStatus(e2.response?.data?.message || 'Credential test failed.');
    } finally {
      setTesting(false);
    }
  };

  const canSave =
    clientId.trim().length > 0 && (settings?.hasClientSecret || clientSecret.trim().length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading Azure setup…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Step 1 — Register your Azure app for this organization (one-time setup).
      </p>

      <div className="rounded-lg border border-border/20 bg-background/60 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Redirect URI (add in Azure)
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 break-all rounded-md border border-border/20 bg-surface-highest/10 px-2 py-1.5 text-[10px] font-mono">
            {redirectUri || '—'}
          </code>
          <button
            type="button"
            onClick={() => void copyRedirectUri()}
            disabled={!redirectUri}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/20 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-surface-highest/20 disabled:opacity-50"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <details className="rounded-lg border border-border/20 bg-background/40 p-3">
        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Azure setup steps
        </summary>
        <ol className="mt-2 space-y-1.5 text-[11px] text-muted-foreground list-decimal list-inside">
          {AZURE_SETUP_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <a
          href="https://learn.microsoft.com/en-us/graph/auth-v2-service#step-1-register-your-app"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
        >
          Microsoft Graph setup guide
          <ExternalLink className="h-3 w-3" />
        </a>
      </details>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
            Application (Client) ID
          </label>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
            Client Secret
            {settings?.hasClientSecret ? (
              <span className="font-normal text-muted-foreground"> (leave blank to keep current)</span>
            ) : null}
          </label>
          <input
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            type="password"
            placeholder={settings?.hasClientSecret ? 'Enter new secret to rotate' : 'Paste secret value from Azure'}
            className="w-full rounded-lg border border-border/20 bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving || !canSave}
          onClick={() => void saveSettings()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
          Save Azure app
        </button>
        <button
          type="button"
          disabled={testing || !settings?.configured}
          onClick={() => void testSettings()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
        >
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Test
        </button>
        {showCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        ) : null}
      </div>

      {status ? (
        <p
          className={cn(
            'text-[11px] rounded-lg border px-2.5 py-2',
            /failed|error|required|invalid/i.test(status)
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          )}
        >
          {status}
        </p>
      ) : null}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, KeyRound, Shield, Sparkles } from 'lucide-react';
import {
  adminService,
  type AiProvider,
  type OrgAiSettings,
  useOrgAiSettings,
} from '../../services/adminService';

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors',
        checked ? 'bg-primary/30' : 'bg-surface-highest/10',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-[14px] w-[14px] transform rounded-full bg-background transition-transform',
          checked ? 'translate-x-[16px]' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
}

function keyStatus(settings: OrgAiSettings | undefined, provider: AiProvider) {
  if (!settings) return false;
  if (provider === 'OPENAI') return settings.hasOpenaiKey;
  if (provider === 'ANTHROPIC') return settings.hasAnthropicKey;
  if (provider === 'GEMINI') return settings.hasGeminiKey;
  return settings.hasOpenSourceKey;
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return 'Not updated yet';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'Not updated yet';
  return dt.toLocaleString();
}

const PROVIDER_HINTS: Record<AiProvider, { modelPlaceholder: string; help: string }> = {
  OPENAI: {
    modelPlaceholder: 'e.g. gpt-4o-mini',
    help: 'Balanced quality and speed for general enterprise workloads.',
  },
  ANTHROPIC: {
    modelPlaceholder: 'e.g. claude-3-5-sonnet',
    help: 'Strong long-form reasoning and policy-heavy assistant behavior.',
  },
  GEMINI: {
    modelPlaceholder: 'e.g. gemini-1.5-pro',
    help: 'Great multimodal tasks and broad context windows.',
  },
  OPEN_SOURCE: {
    modelPlaceholder: '',
    help: 'No additional configuration required in this panel.',
  },
};

export const OrgAiSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useOrgAiSettings();
  const [provider, setProvider] = useState<AiProvider>('OPEN_SOURCE');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [status, setStatus] = useState<string>('');
  // `keyStatus` is evaluated per-provider where needed.

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.provider);
    setModel(settings.model || '');
    setApiKey('');
  }, [settings]);

  useEffect(() => {
    // Prevent accidentally submitting an old key when switching providers.
    setApiKey('');
  }, [provider]);

  const selectProvider = async (next: AiProvider) => {
    if (next === provider) return;
    setProvider(next);
    setStatus('');

    // OPEN_SOURCE should behave as a simple on/off toggle with no Save button.
    if (next !== 'OPEN_SOURCE') return;
    setSwitchingProvider(true);
    try {
      await adminService.updateOrgAiSettings({ provider: 'OPEN_SOURCE' });
      setStatus('Open Source is now active.');
      await queryClient.invalidateQueries({ queryKey: ['org-ai-settings'] });
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setStatus(e2.response?.data?.message || 'Failed to switch provider.');
    } finally {
      setSwitchingProvider(false);
    }
  };

  const saveCurrentProvider = async () => {
    setSaving(true);
    setStatus('');
    try {
      const payload: Record<string, string> = {
        provider,
      };
      if (provider !== 'OPEN_SOURCE') {
        payload.model = model;
      }

      // OPEN_SOURCE is configured without API keys/base URLs in this UI.
      if (provider !== 'OPEN_SOURCE' && apiKey.trim()) {
        if (provider === 'OPENAI') payload.openaiApiKey = apiKey.trim();
        if (provider === 'ANTHROPIC') payload.anthropicApiKey = apiKey.trim();
        if (provider === 'GEMINI') payload.geminiApiKey = apiKey.trim();
      }
      await adminService.updateOrgAiSettings(payload);
      setStatus('Organization AI settings saved.');
      setApiKey('');
      await queryClient.invalidateQueries({ queryKey: ['org-ai-settings'] });
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setStatus(e2.response?.data?.message || 'Failed to save organization AI settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border/20 bg-surface-lowest p-5 dark:bg-surface-highest/5">
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            Organization AI Settings
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Shield className="h-3 w-3" />
            Encrypted at rest
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Configure one organization-level provider policy. Chat requests use this selection and key for all members.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          Last updated: {formatUpdatedAt(settings?.updatedAt)}
        </p>
      </div>

      <div className="mb-5 space-y-3">
        <div className="rounded-xl border border-border/20 bg-surface-low p-4 dark:bg-surface-highest/5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Open Source</p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                Default mode. No key/model fields in this panel.
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>No additional configuration</span>
              </div>
            </div>
            <ToggleSwitch
              checked={provider === 'OPEN_SOURCE'}
              onChange={(next) => {
                if (next) void selectProvider('OPEN_SOURCE');
                else void selectProvider('OPENAI');
              }}
            />
          </div>
          {provider === 'OPEN_SOURCE' && switchingProvider ? (
            <p className="mt-2 text-[11px] text-muted-foreground">Switching…</p>
          ) : null}
          {provider === 'OPEN_SOURCE' && status ? (
            <p className="mt-2 text-[11px] text-muted-foreground">{status}</p>
          ) : null}
        </div>

        {(['OPENAI', 'ANTHROPIC', 'GEMINI'] as const).map((p) => {
          const active = provider === p;
          const configured = keyStatus(settings, p);
          const title = p === 'OPENAI' ? 'OpenAI API Key' : p === 'ANTHROPIC' ? 'Anthropic API Key' : 'Gemini API Key';
          const help =
            p === 'OPENAI'
              ? 'You can put in your OpenAI key to use OpenAI models at cost.'
              : p === 'ANTHROPIC'
                ? 'You can put in your Anthropic key to use Claude at cost.'
                : 'You can put in your Google key to use Gemini at cost.';

          return (
            <div
              key={p}
              className="rounded-xl border border-border/20 bg-surface-low p-4 dark:bg-surface-highest/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{help}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {configured ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>Key saved</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span>No key</span>
                      </>
                    )}
                  </div>
                </div>
                <ToggleSwitch
                  checked={active}
                  onChange={(next) => {
                    if (next) void selectProvider(p);
                    else void selectProvider('OPEN_SOURCE');
                  }}
                />
              </div>

              {active && !isLoading ? (
                <div className="mt-3 space-y-3">
                  <label className="flex flex-col gap-1.5 rounded-xl border border-border/20 bg-surface-high/10 px-4 py-3 dark:bg-surface-high/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Model
                    </span>
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={PROVIDER_HINTS[p].modelPlaceholder}
                      className="rounded-xl border border-border/20 bg-surface-high/10 px-3 py-2 text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground">{PROVIDER_HINTS[p].help}</span>
                  </label>

                  <label className="flex flex-col gap-1.5 rounded-xl border border-border/20 bg-surface-high/10 px-4 py-3 dark:bg-surface-high/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {title}
                    </span>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={configured ? 'Saved key exists (enter to rotate)' : 'Enter API key'}
                      className="rounded-xl border border-border/20 bg-surface-high/10 px-3 py-2 text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {configured ? 'A key is already stored for this provider.' : 'No key stored yet for this provider.'}
                    </span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveCurrentProvider()}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save AI Settings'}
                    </button>
                    {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading AI settings…</div> : null}

      <div className="rounded-xl border border-border/20 bg-surface-lowest px-3 py-3 dark:bg-surface-highest/10">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/75">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Governance Notes
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          <li>API keys are write-only in UI (not returned back after save).</li>
          <li>Leaving API key blank keeps existing key unchanged.</li>
          <li>Switching provider changes model/key source used by chat runtime.</li>
        </ul>
      </div>
    </section>
  );
};

export default OrgAiSettingsPanel;

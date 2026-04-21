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
        'relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-low',
        checked
          ? 'bg-primary/80 border-primary/70 shadow-[0_0_0_1px_rgba(59,130,246,0.28)]'
          : 'bg-surface-highest/30 border-border/40 hover:bg-surface-highest/45',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-4 w-4 rounded-full border shadow-sm',
          checked ? 'border-primary-foreground/30 bg-primary-foreground' : 'border-white/30 bg-zinc-50',
          'transform transition-transform duration-200 will-change-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
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
    modelPlaceholder: 'e.g. llama3, mistral, custom-model',
    help: 'Optional: specify the model name your open-source endpoint uses.',
  },
};

export const OrgAiSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useOrgAiSettings();
  const [provider, setProvider] = useState<AiProvider>('OPEN_SOURCE');
  const [providerModels, setProviderModels] = useState<Record<AiProvider, string>>({
    OPENAI: '',
    ANTHROPIC: '',
    GEMINI: '',
    OPEN_SOURCE: '',
  });
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  // `keyStatus` is evaluated per-provider where needed.
  const effectiveModel = providerModels[provider]?.trim() || 'Not set';
  const effectiveKeyConfigured = keyStatus(settings, provider);

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.provider);
    const fallbackModel = settings.model || '';
    setProviderModels({
      OPENAI:
        settings.providerModels?.OPENAI ??
        (settings.provider === 'OPENAI' ? fallbackModel : ''),
      ANTHROPIC:
        settings.providerModels?.ANTHROPIC ??
        (settings.provider === 'ANTHROPIC' ? fallbackModel : ''),
      GEMINI:
        settings.providerModels?.GEMINI ??
        (settings.provider === 'GEMINI' ? fallbackModel : ''),
      OPEN_SOURCE:
        settings.providerModels?.OPEN_SOURCE ??
        (settings.provider === 'OPEN_SOURCE' ? fallbackModel : ''),
    });
    setApiKey('');
  }, [settings]);

  useEffect(() => {
    // Prevent accidentally submitting an old key when switching providers.
    setApiKey('');
  }, [provider]);

  const selectProvider = (next: AiProvider) => {
    if (next === provider) return;
    setProvider(next);
    setStatus('');
    // All providers (including OPEN_SOURCE) now use the explicit Save button.
  };

  const saveCurrentProvider = async () => {
    setSaving(true);
    setStatus('');
    try {
      const payload: Record<string, string> = {
        provider,
        model: providerModels[provider] || '',
      };

      if (provider !== 'OPEN_SOURCE' && apiKey.trim()) {
        if (provider === 'OPENAI') payload.openaiApiKey = apiKey.trim();
        if (provider === 'ANTHROPIC') payload.anthropicApiKey = apiKey.trim();
        if (provider === 'GEMINI') payload.geminiApiKey = apiKey.trim();
      }
      await adminService.updateOrgAiSettings(payload);
      setStatus(`Saved to ${provider}. This model/key is used whenever this provider is active.`);
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
    <section className="rounded-3xl border border-border/20 bg-surface-lowest p-6 sm:p-8 dark:bg-surface-highest/5 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-info via-violet to-primary"></div>
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
          Switching provider applies its saved model and key to all AI actions: ingest, extract, classify, and chat.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          Last updated: {formatUpdatedAt(settings?.updatedAt)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/85">
          Effective runtime config: <span className="font-semibold text-foreground">{provider}</span> · model{' '}
          <span className="font-semibold text-foreground">{effectiveModel}</span>
          {' · '}
          key{' '}
          <span
            className={[
              'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              effectiveKeyConfigured
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border/30 bg-surface-highest/10 text-muted-foreground',
            ].join(' ')}
          >
            {effectiveKeyConfigured ? 'saved' : 'missing'}
          </span>
        </p>
      </div>

      <div className="mb-5 space-y-3">
        <div
          className={[
            'rounded-xl border bg-surface-low p-4 dark:bg-surface-highest/10 transition-all',
            provider === 'OPEN_SOURCE' ? 'border-primary/45 bg-primary/[0.06]' : 'border-border/20',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Open Source</p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                Default mode. Optionally specify a model name.
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>No API key required</span>
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
          {provider === 'OPEN_SOURCE' && !isLoading ? (
            <div className="mt-3 space-y-3">
              <label className="flex flex-col gap-1.5 rounded-xl border border-border/20 bg-surface-high/10 px-4 py-3 dark:bg-surface-high/5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Model (optional)
                </span>
                <input
                  value={providerModels['OPEN_SOURCE']}
                  onChange={(e) =>
                    setProviderModels((prev) => ({ ...prev, OPEN_SOURCE: e.target.value }))
                  }
                  placeholder={PROVIDER_HINTS['OPEN_SOURCE'].modelPlaceholder}
                  className="rounded-xl border border-border/20 bg-surface-high/10 px-3 py-2 text-sm"
                />
                <span className="text-[11px] text-muted-foreground">{PROVIDER_HINTS['OPEN_SOURCE'].help}</span>
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

        {(['OPENAI', 'ANTHROPIC', 'GEMINI'] as const).map((p) => {
          const active = provider === p;
          const configured = keyStatus(settings, p);
          const modelForProvider = providerModels[p] || '';
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
              className={[
                'rounded-xl border bg-surface-low p-4 dark:bg-surface-highest/10 transition-all',
                active
                  ? 'border-primary/45 bg-primary/[0.06]'
                  : 'border-border/20',
              ].join(' ')}
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
                      value={modelForProvider}
                      onChange={(e) =>
                        setProviderModels((prev) => ({
                          ...prev,
                          [p]: e.target.value,
                        }))
                      }
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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  Globe2,
  Loader2,
  Lock,
  Moon,
  Shield,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/authApi';
import { useThemeStore } from '../../stores/themeStore';
import { useRbac } from '../../hooks/useRbac';
import type { UserDetails, UserProfilePreferences } from '../../types/auth';
import { useAlert } from '../../components/alert';

const AVATAR_MAX_BYTES = 1_400_000;

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

type SectionId = 'profile' | 'preferences' | 'security';

const sections: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Globe2 },
  { id: 'security', label: 'Security', icon: Shield },
];

function displayNameFromUser(u: UserDetails) {
  return u.displayName?.trim() || u.name?.trim() || u.username || u.email?.split('@')[0] || 'Member';
}

const ProfilePage: React.FC = () => {
  const { alert: appAlert } = useAlert();
  const user = useAuthStore((s) => s.user);
  const context = useAuthStore((s) => s.context);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme, toggleTheme } = useThemeStore();
  const { orgRole, activeGroupRole, groups } = useRbac();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SectionId | null;
  const [section, setSection] = useState<SectionId>(
    tabParam && ['profile', 'preferences', 'security'].includes(tabParam) ? tabParam : 'profile'
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [timezone, setTimezone] = useState('UTC');
  const [locale, setLocale] = useState('en');

  const [prefs, setPrefs] = useState<UserProfilePreferences>({
    emailNotifications: true,
    productUpdates: false,
    weeklyDigest: true,
  });

  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);

  const timezoneOptions = React.useMemo(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const set = new Set(TIMEZONES);
    if (detected && !set.has(detected)) {
      return [detected, ...TIMEZONES];
    }
    if (timezone && !set.has(timezone)) {
      return [timezone, ...TIMEZONES];
    }
    return TIMEZONES;
  }, [timezone]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['profile', 'preferences', 'security'].includes(t)) {
      setSection(t as SectionId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(displayNameFromUser(user));
    setJobTitle(user.jobTitle ?? '');
    setPhone(user.phone ?? '');
    setBio(user.bio ?? '');
    setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    setLocale(user.locale || 'en');
    if (user.preferences) {
      setPrefs(user.preferences);
    }
  }, [user]);

  const syncTabToUrl = (id: SectionId) => {
    setSection(id);
    setSearchParams(id === 'profile' ? {} : { tab: id }, { replace: true });
  };

  const onAvatarPick = useCallback(() => fileRef.current?.click(), []);

  const onAvatarFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !file.type.startsWith('image/')) return;
      if (file.size > AVATAR_MAX_BYTES) {
        await appAlert({
          title: 'Image too large',
          description: 'Please use a file under 1.4 MB.',
          variant: 'warning',
        });
        return;
      }
      setAvatarBusy(true);
      try {
        const { avatarUrl } = await authApi.uploadAvatar(file);
        updateUser({ avatarUrl });
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } }; message?: string };
        await appAlert({
          title: 'Upload failed',
          description: ax.response?.data?.message || ax.message || 'Could not upload avatar.',
          variant: 'danger',
        });
      } finally {
        setAvatarBusy(false);
      }
    },
    [appAlert, updateUser]
  );

  const removeAvatar = useCallback(async () => {
    if (avatarBusy) return;
    setAvatarBusy(true);
    try {
      await authApi.removeAvatar();
      updateUser({ avatarUrl: null });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      await appAlert({
        title: 'Remove failed',
        description: ax.response?.data?.message || ax.message || 'Could not remove avatar.',
        variant: 'danger',
      });
    } finally {
      setAvatarBusy(false);
    }
  }, [appAlert, updateUser, avatarBusy]);

  const saveProfile = useCallback(() => {
    if (!user) return;
    updateUser({
      displayName: displayName.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      timezone,
      locale,
    });
    setSavedProfile(true);
    window.setTimeout(() => setSavedProfile(false), 2600);
  }, [user, displayName, jobTitle, phone, bio, timezone, locale, updateUser]);

  const savePreferences = useCallback(() => {
    updateUser({ preferences: prefs });
    setSavedPrefs(true);
    window.setTimeout(() => setSavedPrefs(false), 2600);
  }, [prefs, updateUser]);

  const changePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPwdMsg(null);
      if (newPwd.length < 8) {
        setPwdMsg({ type: 'err', text: 'New password must be at least 8 characters.' });
        return;
      }
      if (newPwd !== confirmPwd) {
        setPwdMsg({ type: 'err', text: 'New passwords do not match.' });
        return;
      }
      setPwdBusy(true);
      try {
        await authApi.changePassword({
          currentPassword: currentPwd,
          newPassword: newPwd,
          orgId: context?.orgId || user?.orgId || undefined,
        });
        setPwdMsg({ type: 'ok', text: 'Password updated.' });
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } }; message?: string };
        setPwdMsg({
          type: 'err',
          text: ax.response?.data?.message || ax.message || 'Could not change password.',
        });
      } finally {
        setPwdBusy(false);
      }
    },
    [currentPwd, newPwd, confirmPwd, context?.orgId, user?.orgId]
  );

  if (!user || !context) {
    return <Navigate to="/login" replace />;
  }

  const email = user.email ?? '';
  const initials =
    displayNameFromUser(user)
      .slice(0, 2)
      .toUpperCase()
      .replace(/[^A-Z]/g, '') || 'ME';
  const activeWorkspace =
    groups.find((g) => g.groupId === context.activeGroupId)?.groupName || 'Workspace';
  const roleLabel =
    orgRole === 'COMPANY_ADMIN'
      ? 'Company admin'
      : activeGroupRole === 'GROUP_ADMIN'
        ? 'Group admin'
        : activeGroupRole === 'SEARCH_USER'
          ? 'Search user'
          : 'Member';

  return (
    <div className="w-full max-w-6xl mx-auto pb-16 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border/20 bg-surface-highest/10 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>

      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/20 dark:border-border/10 bg-gradient-to-br from-primary/15 via-surface-highest/20 to-background p-6 sm:p-10 shadow-2xl shadow-black/20">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-violet/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-2xl border-2 border-border/20 dark:border-border/10 bg-surface-highest shadow-xl ring-4 ring-primary/10 sm:h-32 sm:w-32">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-primary/10 text-2xl font-black text-primary-foreground">
                    {initials}
                  </div>
                )}
                {avatarBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-scrim">
                    <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onAvatarPick}
                disabled={avatarBusy}
                className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-xl border border-border/20 bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:brightness-110 disabled:opacity-50"
                title="Upload photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onAvatarFile}
              />
            </div>
            <div className="text-center sm:pb-1 sm:text-left">
              <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {displayNameFromUser(user)}
              </h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="rounded-full border border-border/20 bg-surface-highest/10 dark:border-border/10 dark:bg-surface-highest/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  {roleLabel}
                </span>
                <span className="rounded-full border border-border/20 bg-surface-highest/5 dark:border-border/10 dark:bg-surface-highest/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {activeWorkspace}
                </span>
              </div>
            </div>
          </div>
          {user.avatarUrl ? (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={avatarBusy}
                className="self-center rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-destructive transition hover:bg-destructive/20 sm:self-auto"
              >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5" />
                Remove photo
              </span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Side nav */}
        <nav className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-52 lg:flex-col lg:overflow-visible lg:pb-0">
          {sections.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => syncTabToUrl(s.id)}
                className={cn(
                  'flex min-w-[8.5rem] items-center gap-2 rounded-2xl border px-4 py-3 text-left text-[12px] font-bold transition-all lg:min-w-0',
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary shadow-inner shadow-primary/5'
                    : 'border-transparent text-muted-foreground hover:border-border/30 hover:bg-muted/20 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-8">
          <AnimatePresence mode="wait">
            {section === 'profile' && (
              <motion.section
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-3xl border border-border/20 bg-surface-lowest dark:bg-surface-highest/5 dark:border-border/10 p-6 sm:p-8"
              >
                <h2 className="font-display text-lg font-black text-foreground">Personal information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update how you appear across Findout AI. Your email is managed by your organization.
                </p>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      Display name
                    </span>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-xl border border-border/10 bg-background/60 px-4 py-3 text-sm font-semibold outline-none ring-primary/20 transition focus:border-primary/40 focus:ring-2"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      Job title
                    </span>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Analyst"
                      className="w-full rounded-xl border border-border/10 bg-background/60 px-4 py-3 text-sm font-semibold outline-none ring-primary/20 transition focus:border-primary/40 focus:ring-2"
                    />
                  </label>
                  <label className="block space-y-2 sm:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      Email
                    </span>
                    <input
                      value={email}
                      readOnly
                      className="w-full cursor-not-allowed rounded-xl border border-dashed border-border/10 bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      Phone
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 · · · · · · · · ·"
                      className="w-full rounded-xl border border-border/10 bg-background/60 px-4 py-3 text-sm font-semibold outline-none ring-primary/20 transition focus:border-primary/40 focus:ring-2"
                    />
                  </label>
                  <label className="block space-y-2 sm:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      Bio
                    </span>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      placeholder="A short bio for your teammates…"
                      className="w-full resize-y rounded-xl border border-border/10 bg-background/60 px-4 py-3 text-sm leading-relaxed outline-none ring-primary/20 transition focus:border-primary/40 focus:ring-2"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      Timezone
                    </span>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-xl border border-border/10 bg-background/60 px-4 py-3 text-sm font-semibold outline-none ring-primary/20 transition focus:border-primary/40 focus:ring-2"
                    >
                      {timezoneOptions.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                      Language
                    </span>
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                      className="w-full rounded-xl border border-border/10 bg-background/60 px-4 py-3 text-sm font-semibold outline-none ring-primary/20 transition focus:border-primary/40 focus:ring-2"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={saveProfile}
                    className="rounded-xl bg-primary px-6 py-3 text-[11px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.98]"
                  >
                    Save profile
                  </button>
                  {savedProfile && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-success">
                      <Check className="h-4 w-4" />
                      Saved
                    </span>
                  )}
                </div>
              </motion.section>
            )}

            {section === 'preferences' && (
              <motion.section
                key="preferences"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-border/10 bg-surface-highest/5 p-6 sm:p-8">
                  <h2 className="font-display text-lg font-black text-foreground">Appearance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose how Findout AI looks on this device.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {(['light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={cn(
                          'flex items-center gap-2 rounded-2xl border px-5 py-3 text-[12px] font-bold capitalize transition',
                          theme === t
                            ? 'border-primary/50 bg-primary/15 text-primary'
                            : 'border-border/10 bg-background/40 text-muted-foreground hover:border-border/20'
                        )}
                      >
                        {t === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {t}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => toggleTheme()}
                      className="rounded-2xl border border-dashed border-border/15 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                    >
                      Toggle
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/10 bg-surface-highest/5 p-6 sm:p-8">
                  <h2 className="font-display text-lg font-black text-foreground">Notifications</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Control emails and digests. Changes apply to this account only.
                  </p>
                  <ul className="mt-6 space-y-4">
                    {(
                      [
                        ['emailNotifications', 'Email notifications', 'Important alerts about your workspaces.'],
                        ['productUpdates', 'Product updates', 'Occasional news about features and improvements.'],
                        ['weeklyDigest', 'Weekly digest', 'A summary of activity across your groups.'],
                      ] as const
                    ).map(([key, title, desc]) => (
                      <li
                        key={key}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-border/5 bg-background/30 p-4"
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Bell className="h-4 w-4 shrink-0 text-primary" />
                            {title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={prefs[key]}
                          onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                          className={cn(
                            'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                            prefs[key] ? 'bg-primary' : 'bg-muted/40'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-0.5 h-6 w-6 rounded-full bg-surface-highest shadow transition-transform',
                              prefs[key] ? 'left-6' : 'left-0.5'
                            )}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={savePreferences}
                      className="rounded-xl bg-primary px-6 py-3 text-[11px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110"
                    >
                      Save preferences
                    </button>
                    {savedPrefs && (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-success">
                        <Check className="h-4 w-4" />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {section === 'security' && (
              <motion.section
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-border/10 bg-surface-highest/5 p-6 sm:p-8">
                  <h2 className="font-display text-lg font-black text-foreground">Change password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Signed-in users can update the password here. Requests include your organization scope.
                  </p>
                  {pwdMsg ? (
                    <p
                      className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${
                        pwdMsg.type === 'ok'
                        ? 'border-success/30 bg-success/10 text-success'
                          : 'border-destructive/30 bg-destructive/10 text-destructive'
                      }`}
                    >
                      {pwdMsg.text}
                    </p>
                  ) : null}
                  <form onSubmit={changePasswordSubmit} className="mt-6 space-y-4 max-w-md">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Current password
                      </label>
                      <input
                        type="password"
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border/10 bg-background/40 px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-primary/40"
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        New password
                      </label>
                      <input
                        type="password"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border/10 bg-background/40 px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-primary/40"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border/10 bg-background/40 px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-primary/40"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pwdBusy}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[11px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 disabled:opacity-50"
                    >
                      {pwdBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Update password
                    </button>
                  </form>
                  <p className="mt-8 text-sm text-muted-foreground">Forgot your current password?</p>
                  <Link
                    to={
                      context.orgId
                        ? `/forgot-password?orgId=${encodeURIComponent(context.orgId)}`
                        : '/forgot-password'
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-[12px] font-bold text-primary transition hover:bg-primary/20"
                  >
                    <Lock className="h-4 w-4" />
                    Reset via email
                  </Link>
                </div>

                <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8">
                  <h2 className="font-display text-lg font-black text-destructive">Sign out everywhere</h2>
                  <p className="mt-1 text-sm text-destructive/70">
                    End this session on this browser. You can sign in again anytime.
                  </p>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="mt-6 rounded-xl border border-destructive/40 bg-destructive/20 px-5 py-3 text-[12px] font-black uppercase tracking-widest text-destructive transition hover:bg-destructive/30"
                  >
                    Sign out
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

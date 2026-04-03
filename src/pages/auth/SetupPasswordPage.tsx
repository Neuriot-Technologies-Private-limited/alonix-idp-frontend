import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import logoFull from '../../assets/findoutai_logo-w.png';
import { authApi } from '../../services/authApi';

const EXPIRED_INVITE_COPY = 'Your invitation is expired. Please request a new invite.';

const getInviteErrorMessage = (err: unknown): string => {
  const ax = err as {
    response?: { status?: number; data?: { code?: string; message?: string } };
    message?: string;
  };
  const code = String(ax.response?.data?.code || '').toUpperCase();
  const message = String(ax.response?.data?.message || '');

  if (
    ax.response?.status === 410 ||
    code === 'INVITE_EXPIRED' ||
    /expired invitation|invitation is expired|invitation link is no longer valid/i.test(message)
  ) {
    return EXPIRED_INVITE_COPY;
  }
  return message || ax.message || 'Invitation is invalid or expired';
};

const SetupPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [inviteInvalid, setInviteInvalid] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const submitLockRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const loadInvite = async () => {
      // Reset any prior UI state when loading a new invite token
      setError('');
      setInfo('');
      setInviteInvalid(false);
      setIsRedirecting(false);
      if (!inviteToken) {
        setError('Missing invitation token. Please use the invitation email link.');
        setInviteInvalid(true);
        setLoadingInvite(false);
        return;
      }
      try {
        const invite = await authApi.getInviteDetails(inviteToken);
        if (!mounted) return;
        setEmail(String(invite.email || ''));
        if (invite.inviteeName) setName(String(invite.inviteeName));
      } catch (err: unknown) {
        if (!mounted) return;
        setError(getInviteErrorMessage(err));
        setInviteInvalid(true);
      } finally {
        if (mounted) setLoadingInvite(false);
      }
    };
    loadInvite();
    return () => {
      mounted = false;
    };
  }, [inviteToken]);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent duplicate submissions even if React state hasn't flushed yet.
    if (submitLockRef.current || isLoading) return;
    submitLockRef.current = true;
    if (!inviteToken) {
      setError('Missing invitation token. Please use the invitation email link.');
      setInviteInvalid(true);
      submitLockRef.current = false;
      return;
    }
    if (String(password).length < 8) {
      setError('Password must be at least 8 characters.');
      submitLockRef.current = false;
      return;
    }
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      const res = (await authApi.onboardInvite({
        inviteToken,
        email: email.trim(),
        password,
        name: name.trim(),
      })) as { orgId?: string; emailVerificationSent?: boolean };
      const q = new URLSearchParams({ email: email.trim() });
      if (res.orgId) q.set('orgId', String(res.orgId));
      if (res.emailVerificationSent === false) q.set('devMail', '1');
      setInfo('Password set successfully. Redirecting to OTP verification...');
      setIsRedirecting(true);
      window.setTimeout(() => {
        navigate(`/verify?${q.toString()}`, { replace: true });
      }, 550);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const msg = getInviteErrorMessage(err);

      // The backend may return 409 duplicate-key when the same invite is submitted twice
      // (e.g., double-click / slow UI). In that case, try OTP verification flow anyway.
      if (ax.response?.status === 409 && /already exists/i.test(msg) && email.trim()) {
        setError('');
        setInfo('Account already exists. Redirecting to OTP verification...');
        setIsRedirecting(true);
        const q = new URLSearchParams({ email: email.trim() });
        window.setTimeout(() => {
          navigate(`/verify?${q.toString()}`, { replace: true });
        }, 550);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
      submitLockRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-40">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary-container/5 blur-[120px] rounded-full"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl z-10 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden glass rounded-[2rem] shadow-4xl border border-border/5"
      >
        <div className="flex flex-col justify-between p-8 md:p-12 bg-surface-highest/10 relative overflow-hidden border-r border-border/5">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
          </div>

          <div className="relative z-10">
            <Link to="/">
              <img src={logoFull} alt="FindoutAI" className="h-9 mb-12 object-contain" />
            </Link>
            <h3 className="text-3xl md:text-4xl font-extrabold font-display leading-[1.1] mb-8 text-foreground">
              Complete Your <br />
              <span className="text-primary underline decoration-primary/20 underline-offset-[12px] decoration-4">Invitation Access</span>
            </h3>
            <ul className="space-y-6">
              {['Password setup from secure invite', 'Organization-bound access only', 'Email OTP verification required'].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 text-sm font-bold text-muted-foreground/80"
                >
                  <div className="w-5 h-5 rounded-full border border-primary/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 pt-16">
            <div className="p-6 rounded-2xl bg-surface-highest/20 border border-border/5 flex items-center gap-5 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-1">Invite Protected</p>
                <p className="text-[11px] text-muted-foreground/70 font-bold leading-tight">No standalone signup <br />Outside your organization</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-col justify-center bg-surface-lowest/40 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold font-display mb-2 text-foreground tracking-tight">Set Up Password</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed font-medium">Finish your invitation setup to continue.</p>
          </div>

          {error ? (
            <p className="mb-4 text-sm font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="mb-4 text-sm font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
              {info}
            </p>
          ) : null}

          {isRedirecting ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-6 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
              <p className="text-sm font-semibold text-primary">
                Preparing your OTP verification screen...
              </p>
            </div>
          ) : inviteInvalid ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {EXPIRED_INVITE_COPY}
              </p>
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] border border-border/20 text-foreground hover:bg-surface-highest/10 transition-colors"
                >
                  Go To Login
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  Back To Home
                </Link>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSetupPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">Full Name</label>
              <div className="relative group/input">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-highest/10 border border-border/5 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/20"
                  placeholder="John Curator"
                  required
                  disabled={loadingInvite || isLoading || isRedirecting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">Invited Email</label>
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="email"
                  value={email}
                  className="w-full bg-surface-highest/10 border border-border/5 rounded-2xl py-4 pl-14 pr-4 text-sm font-bold text-foreground"
                  placeholder="name@company.com"
                  required
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  className="w-full bg-surface-highest/10 border border-border/5 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/20"
                  placeholder="Min. 8 characters"
                  required
                  disabled={loadingInvite || isLoading || isRedirecting}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loadingInvite || isLoading || isRedirecting || !email}
              className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-4 shadow-xl shadow-primary/20 rounded-2xl relative overflow-hidden group/btn disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-surface-highest/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              {loadingInvite || isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-sm font-black font-display uppercase tracking-[0.2em]">Set Password & Continue</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                </>
              )}
            </motion.button>
          </form>
          )}

          <p className="mt-8 text-center text-sm font-bold text-muted-foreground/60">
            Already verified? <Link to="/login" className="text-primary hover:text-primary-container transition-colors ml-1 border-b border-primary/20">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupPasswordPage;

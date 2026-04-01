import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, ArrowRight, ChevronLeft, KeyRound } from 'lucide-react';
import logoFull from '../../assets/findoutai_logo-w.png';
import { authApi } from '../../services/authApi';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const orgId = searchParams.get('orgId') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token.trim() || !email.trim()) {
      setError('Invalid or expired reset link. Request a new one from Forgot password.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword: password,
        orgId: orgId.trim() || undefined,
      });
      setDone(true);
      window.setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-40">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[-18%] right-[-8%] w-[55%] h-[55%] bg-primary/10 blur-[140px] rounded-full"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10 overflow-hidden glass rounded-[2rem] shadow-4xl border border-border/5 p-8 md:p-10"
      >
        <Link to="/">
          <img src={logoFull} alt="FindoutAI" className="h-9 mb-8 object-contain" />
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground">Set new password</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {email ? (
                <>
                  For <span className="font-bold text-foreground/90">{email}</span>
                </>
              ) : (
                'Open this page from the link we emailed you.'
              )}
            </p>
          </div>
        </div>

        {done ? (
          <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm font-bold text-primary">
            Password updated. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-border/5 bg-surface-highest/10 py-4 pl-14 pr-4 text-sm font-bold text-foreground outline-none transition focus:border-primary/40 focus:bg-surface-highest/20"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-2xl border border-border/5 bg-surface-highest/10 py-4 pl-14 pr-4 text-sm font-bold text-foreground outline-none transition focus:border-primary/40 focus:bg-surface-highest/20"
                  placeholder="Repeat password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary relative mt-2 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 shadow-xl shadow-primary/20"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <span className="text-sm font-black font-display uppercase tracking-[0.2em]">Update password</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-8 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-primary transition hover:opacity-80"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to login
        </Link>
      </motion.div>

      <footer className="relative z-10 mt-12 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
        &copy; 2026 Alonix Intelligence Systems.
      </footer>
    </div>
  );
};

export default ResetPasswordPage;

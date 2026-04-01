import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, LayoutDashboard, Sparkles } from 'lucide-react';
import { authApi } from '../../services/authApi';
import logoFull from '../../assets/findoutai_logo-w.png';
import { useAlert } from '../../components/alert';

const LoginPage: React.FC = () => {
  const { alert: appAlert } = useAlert();
  const [searchParams] = useSearchParams();
  const orgIdFromUrl = searchParams.get('orgId') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const { token, user, context } = await authApi.login(
        email,
        password,
        orgIdFromUrl || undefined
      );
      setAuth(token, user, context);
      setIsLoading(false);
      setFormError(null);
      navigate('/dashboard');
    } catch (err: unknown) {
      setIsLoading(false);
      const ax = err as { response?: { status?: number; data?: { message?: string; code?: string } }; message?: string };
      const msg = ax.response?.data?.message || ax.message || 'Authentication failed';
      if (ax.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        await appAlert({
          title: 'Email not verified',
          description: `${msg} Use the code we emailed you, or resend from the verification page.`,
          variant: 'warning',
        });
        const q = new URLSearchParams({ email: email.trim() });
        navigate(`/verify?${q.toString()}`);
        return;
      }
      setFormError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl z-10 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden glass rounded-[2rem] shadow-4xl border border-border/20 dark:border-border/10"
      >
        {/* Left Side: Cinematic Branding */}
        <div className="flex flex-col justify-between p-8 md:p-12 bg-surface-highest/10 relative overflow-hidden border-r border-border/10 dark:border-border/5">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
          </div>

          <div className="relative z-10">
            <Link to="/">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={logoFull}
                alt="FindoutAI"
                className="h-9 mb-12 object-contain"
              />
            </Link>
            <h3 className="text-3xl md:text-4xl font-extrabold font-display leading-[1.1] mb-8 text-foreground">
              Welcome back
              to the <br />
              <span className="text-primary underline decoration-primary/20 underline-offset-[12px] decoration-4">Digital Curator</span>
            </h3>

            <div className="space-y-8 mt-12">
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground mb-1">Intelligence Awaits</h4>
                  <p className="text-sm text-muted-foreground/70 font-bold leading-relaxed">Your workspace is synchronized and ready for new document nodes.</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-xl bg-surface-highest flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground mb-1">Total Control</h4>
                  <p className="text-sm text-muted-foreground/70 font-bold leading-relaxed">Manage permissions and groups with enterprise-grade precision.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-16">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Intelligence / Security / Clarity</p>
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-col justify-center bg-surface-lowest/40 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold font-display mb-2 tracking-tight">Authorize Access</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed font-medium">Please enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">Work Email</label>
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-highest/10 border border-border/20 dark:border-border/10 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/40"
                  placeholder="e.g. curator@alonix.ai"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Password</label>
                <Link to="/forgot-password" title="Recover Access" className="text-[10px] text-primary hover:text-primary-container font-black uppercase tracking-[0.2em] transition-colors">Forgot?</Link>
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-highest/10 border border-border/20 dark:border-border/10 rounded-2xl py-4 pl-14 pr-12 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/40"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/30 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-4 shadow-xl shadow-primary/20 rounded-2xl relative overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-surface-highest/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-sm font-black font-display uppercase tracking-[0.2em]">Authorize Node</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                </>
              )}
            </motion.button>

            {formError ? (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
          </form>

          <p className="mt-12 text-center text-sm font-bold text-muted-foreground/60">
            New to FindoutAI? <Link to="/signup" className="text-primary hover:text-primary-container transition-colors ml-1 border-b border-primary/20">Establish Workspace</Link>
          </p>
        </div>
      </motion.div>

      <footer className="mt-16 text-[90px] md:text-[180px] font-black text-foreground/[0.01] absolute bottom-[-40px] left-1/2 -translate-x-1/2 select-none pointer-events-none whitespace-nowrap tracking-tighter">
        FINDOUTAI
      </footer>
    </div>
  );
};

export default LoginPage;

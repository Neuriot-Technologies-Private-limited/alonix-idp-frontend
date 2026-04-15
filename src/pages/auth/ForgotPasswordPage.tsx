import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle2, ChevronLeft, ShieldCheck, Building2 } from 'lucide-react';
import logoFull from '../../assets/1-glance.png';
import { authApi } from '../../services/authApi';

const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [orgId, setOrgId] = useState(searchParams.get('orgId') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim(), orgId.trim() || undefined);
      setIsSent(true);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary-container/5 blur-[120px] rounded-full"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl z-10 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden glass rounded-[2rem] shadow-4xl border border-border/5"
      >
        {/* Left Side: Branding/Status */}
        <div className="flex flex-col justify-between p-8 md:p-12 bg-surface-highest/10 relative overflow-hidden border-r border-border/5">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
          </div>

          <div className="relative z-10">
            <Link to="/">
              <img src={logoFull} alt="1-glance" className="h-10 md:h-12 mb-12 origin-left scale-[1.25] object-contain" />
            </Link>
            <h3 className="text-3xl md:text-4xl font-extrabold font-display leading-[1.1] mb-8 text-foreground">
              Recover Your <br />
              <span className="text-primary underline decoration-primary/20 underline-offset-[12px] decoration-4">Access Node</span>
            </h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-[280px]">
              Security is our core philosophy. Follow the verified recovery protocol to regain control of your intelligence workspace.
            </p>
          </div>

          <div className="relative z-10 pt-16">
            <div className="p-6 rounded-2xl bg-surface-highest/20 border border-border/5 flex items-center gap-5 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-1">Encrypted Protocol</p>
                <p className="text-[11px] text-muted-foreground/70 font-bold leading-tight">Multi-Factor Recovery <br />Verified Link Dispatch</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-surface-lowest/40 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold font-display mb-2 text-foreground tracking-tight">Recover Access</h2>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">It happens to the best of us. Enter your email to receive recovery instructions.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error ? (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
                      {error}
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">Account Email</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-surface-highest/10 border border-border/5 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/20"
                        placeholder="curator@alonix.ai"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">
                      Organization ID <span className="font-normal text-muted-foreground/40">(optional)</span>
                    </label>
                    <div className="relative group/input">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary" />
                      <input
                        type="text"
                        value={orgId}
                        onChange={(e) => setOrgId(e.target.value)}
                        className="w-full bg-surface-highest/10 border border-border/5 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/20"
                        placeholder="If your workspace uses multi-tenant routing"
                        autoComplete="off"
                      />
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
                        <span className="text-sm font-black font-display uppercase tracking-[0.2em]">Send Recovery Link</span>
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </form>

                <p className="mt-12 text-center text-sm font-bold text-muted-foreground/60">
                  Remembered details? <Link to="/login" className="text-primary hover:text-primary-container transition-colors ml-1 border-b border-primary/20">Sign In</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-extrabold font-display mb-4 text-foreground tracking-tight">Check Your Email</h2>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8 px-4">
                  Security instructions have been dispatched to <br />
                  <span className="text-foreground font-black">{email}</span>
                </p>
                <div className="pt-4 border-t border-border/5">
                  <Link to="/login" className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:opacity-80 transition-opacity">
                    <ChevronLeft className="w-5 h-5" />
                    Return to Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <footer className="mt-12 text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] relative z-10 transition-opacity hover:opacity-100 opacity-50">
        &copy; 2026 Alonix Intelligence Systems.
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;

import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import logoFull from '../../assets/findoutai_logo-w.png';
import { authApi } from '../../services/authApi';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') || '';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let orgIdFromSignup: string | undefined;
      let emailVerificationSent = true;
      if (inviteToken) {
        const inv = (await authApi.onboardInvite({
          inviteToken,
          email: email.trim(),
          password,
          name: name.trim(),
        })) as { orgId?: string; emailVerificationSent?: boolean };
        if (inv.orgId) orgIdFromSignup = String(inv.orgId);
        if (inv.emailVerificationSent === false) emailVerificationSent = false;
      } else {
        const res = (await authApi.onboardCompany({
          companyName: orgName.trim(),
          email: email.trim(),
          password,
          name: name.trim(),
        })) as { organization?: { _id?: string }; emailVerificationSent?: boolean };
        const oid = res.organization?._id;
        if (oid) orgIdFromSignup = String(oid);
        if (res.emailVerificationSent === false) emailVerificationSent = false;
      }
      const q = new URLSearchParams({ email: email.trim() });
      if (inviteToken) q.set('inviteToken', inviteToken);
      if (orgIdFromSignup) q.set('orgId', orgIdFromSignup);
      if (!emailVerificationSent) q.set('devMail', '1');
      navigate(`/verify?${q.toString()}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Signup failed');
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
        {/* Left Side: Branding/Value Prop (Cinematic Style) */}
        <div className="flex flex-col justify-between p-8 md:p-12 bg-surface-highest/10 relative overflow-hidden border-r border-border/5">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
          </div>

          <div className="relative z-10">
            <Link to="/">
              <img src={logoFull} alt="FindoutAI" className="h-9 mb-12 object-contain" />
            </Link>
            <h3 className="text-3xl md:text-4xl font-extrabold font-display leading-[1.1] mb-8 text-foreground">
              Establish Your <br />

              <span className="text-primary underline decoration-primary/20 underline-offset-[12px] decoration-4">Intelligence Node</span>
            </h3>
            <ul className="space-y-6">
              {[
                'Neural Document Analysis',
                'Advanced PII Redaction',
                'Role-Based Workspace Control',
                'Isolated Private Data Nodes'
              ].map((item, i) => (
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
                <p className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-1">Compliance Ready</p>
                <p className="text-[11px] text-muted-foreground/70 font-bold leading-tight">SOC2 • GDPR • HIPAA <br />Compliant Infrastructure</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-col justify-center bg-surface-lowest/40 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold font-display mb-2 text-foreground tracking-tight">Create Account</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed font-medium">Join the next generation of curators.</p>
          </div>

          {inviteToken ? (
            <p className="mb-4 text-xs font-bold text-primary/90 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              You are completing signup from a group invitation. Organization fields are not required.
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 text-sm font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              {error}
            </p>
          ) : null}
          <form onSubmit={handleSignup} className="space-y-5">
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
                />
              </div>
            </div>
            {!inviteToken ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">Organization Name</label>
                <div className="relative group/input">
                  <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-surface-highest/10 border border-border/5 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/20"
                    placeholder="Acme Intelligence"
                    required={!inviteToken}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] ml-1">Work Email</label>
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within/input:text-primary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-highest/10 border border-border/5 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/20"
                  placeholder="name@company.com"
                  required
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
                  className="w-full bg-surface-highest/10 border border-border/5 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-primary/40 focus:bg-surface-highest/20 transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/20"
                  placeholder="Min. 8 characters"
                  required
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
                  <span className="text-sm font-black font-display uppercase tracking-[0.2em]">Create Workspace</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm font-bold text-muted-foreground/60">
            Have an account? <Link to="/login" className="text-primary hover:text-primary-container transition-colors ml-1 border-b border-primary/20">Sign In</Link>
          </p>
        </div>
      </motion.div>

      <footer className="mt-12 text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.4em] relative z-10 transition-opacity hover:opacity-100 opacity-50">
        &copy; 2026 Alonix Intelligence Systems.
      </footer>
    </div>
  );
};

export default SignupPage;

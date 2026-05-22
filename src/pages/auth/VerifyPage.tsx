import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AuthPageLogo, AuthPageFooter } from '../../components/branding/AuthPageBranding';
import { authApi } from '../../services/authApi';

const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const orgIdParam = searchParams.get('orgId') || '';
  const devMailHint = searchParams.get('devMail') === '1';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(59);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailParam.trim()) {
      setError('Missing email. Return to signup and try again.');
      return;
    }
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      await authApi.verifyEmail(emailParam, otp.join(''), orgIdParam || undefined);
      setInfo('Email verified. You can sign in.');
      const q = new URLSearchParams();
      if (orgIdParam.trim()) q.set('orgId', orgIdParam.trim());
      setTimeout(() => navigate(q.toString() ? `/login?${q.toString()}` : '/login'), 1200);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailParam.trim()) return;
    setError('');
    setInfo('');
    try {
      await authApi.resendVerification(emailParam, orgIdParam || undefined);
      setInfo('If the account exists, a new code was sent.');
      setTimer(59);
    } catch {
      setError('Could not resend. Try again later.');
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
        className="w-full max-w-5xl z-10 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden glass rounded-[2rem] shadow-4xl border border-border/10"
      >
        {/* Left Side: Branding/Verification Status */}
        <div className="flex flex-col justify-between p-8 md:p-12 bg-surface-highest/10 relative overflow-hidden border-r border-border/10">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
          </div>
          
          <div className="relative z-10">
            <Link to="/">
              <AuthPageLogo className="h-10 md:h-12 mb-12 origin-left scale-[1.25] object-contain" />
            </Link>
            <h3 className="text-3xl md:text-4xl font-extrabold font-display leading-[1.1] mb-8 text-foreground">
              Verify <br />
              Your <br />
              <span className="text-primary underline decoration-primary/20 underline-offset-[12px] decoration-4">Identity <br /> Node</span>
            </h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-[280px]">
              We have dispatched a temporary access token to your authorized workspace email. Enter it to establish a secure session.
            </p>
            {emailParam ? (
              <p className="mt-4 text-xs font-bold text-primary/80 break-all">{emailParam}</p>
            ) : null}
          </div>

          <div className="relative z-10 pt-16">
            <div className="p-6 rounded-2xl bg-surface-highest/20 border border-border/10 flex items-center gap-5 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] mb-1">Authenticated Access</p>
                <p className="text-[11px] text-muted-foreground/70 font-bold leading-tight">Zero-Trust Protocol <br />Session Isolated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: OTP Section */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-surface-lowest/40 backdrop-blur-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold font-display mb-2 text-foreground tracking-tight">Authorize Device</h2>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">Please enter the 6-digit code sent to your email.</p>
          </div>

          {devMailHint ? (
            <p className="mb-4 text-xs font-bold text-warning/90 bg-warning/10 border border-warning/25 rounded-xl px-4 py-3 leading-relaxed">
              Email was not sent from this server (SMTP off or not configured). For local development, open the{' '}
              <span className="text-warning">terminal where the API runs</span> — the 6-digit code is printed there.
                To receive real mail, set <code className="rounded bg-surface-highest/10 px-1 py-0.5 text-[10px]">SMTP_ENABLED=true</code> and valid SMTP credentials in the backend <code className="rounded bg-surface-highest/10 px-1 py-0.5 text-[10px]">.env</code>.
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 text-sm font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">{error}</p>
          ) : null}
          {info ? (
            <p className="mb-4 text-sm font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">{info}</p>
          ) : null}

          <form onSubmit={handleVerify} className="space-y-8">
            <div className="flex justify-between gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-full aspect-square bg-surface-highest/10 border-2 border-border/50 dark:border-muted-foreground/40 rounded-2xl text-center text-2xl font-black outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:bg-surface-highest/20 transition-all text-foreground shadow-sm"
                  required
                />
              ))}
            </div>

            <div className="space-y-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || otp.join('').length < 6}
                className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-primary/20 relative overflow-hidden group/btn disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-surface-highest/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-sm font-black font-display uppercase tracking-[0.2em]">Verify & Access</span>
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                  </>
                )}
              </motion.button>

              <div className="flex flex-col items-center gap-4">
                {timer > 0 ? (
                  <p className="text-xs text-muted-foreground/60 font-black uppercase tracking-[0.1em]">
                    Resend available in <span className="text-primary">{timer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[10px] text-primary font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resend Verification Code
                  </button>
                )}
              </div>
            </div>
          </form>

          <p className="mt-12 text-center text-sm font-bold text-muted-foreground/60">
            Wrong email? <Link to="/login" className="text-primary hover:text-primary-container transition-colors ml-1 border-b border-primary/20">Return to Login</Link>
          </p>
        </div>
      </motion.div>

      <AuthPageFooter />
    </div>
  );
};

export default VerifyPage;

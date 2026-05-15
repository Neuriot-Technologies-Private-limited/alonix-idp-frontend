import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlayCircle,
  LayoutDashboard,
  ShieldCheck,
  Workflow,
  Sparkles,
  FolderOpen,
  PieChart as Insights,
  Check,
  Brain,
  Leaf,
  Diamond,
  Crown,
  Cpu
} from 'lucide-react';
import logoFull from '../../assets/1-glance.png';

const LandingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src={logoFull} alt="1-glance" className="h-10 md:h-12 origin-left object-contain" />
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground font-display">
            <a href="#features" className="hover:text-primary transition-colors">Solutions</a>
            <a href="#intelligence" className="hover:text-primary transition-colors">Intelligence</a>
            <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold hover:text-primary transition-colors px-4 font-display">Login</Link>
            <Link
              to="/signup"
              className="btn-primary py-2.5 px-6 rounded-md text-sm font-bold shadow-lg shadow-primary/20 font-display"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-2">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center pt-32 px-6 overflow-hidden">
          {/* Atmospheric Depth Background */}
          <div className="absolute inset-0 z-0">
            <motion.div
              animate={{
                x: [0, 20, 0],
                y: [0, -20, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"
            />
            <motion.div
              animate={{
                x: [0, -30, 0],
                y: [0, 30, 0]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full"
            />
          </div>

          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="relative z-10 max-w-7xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="font-display text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-foreground"
            >
              The Digital Curator for Your <br />
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#ADC6FF] bg-clip-text text-transparent">
                Document Intelligence Platform
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              A sophisticated, silent partner—organizing, surfacing, and securing document intelligence with enterprise-grade AI.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col md:flex-row gap-6 justify-center items-center mb-20"
            >
              <Link to="/signup" className="w-full md:w-auto btn-primary text-lg px-8 py-4 rounded-md shadow-xl shadow-primary/25">
                Get Started for Free
              </Link>
              <button className="w-full md:w-auto glass hover:bg-surface-highest/20 text-primary font-bold text-lg px-8 py-4 rounded-md flex items-center justify-center gap-3 transition-all active:scale-95 group">
                <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Watch Product Tour
              </button>
            </motion.div>

            {/* Floating Glassmorphic UI Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="relative w-full max-w-6xl mx-auto group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-container/20 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
              <div className="relative glass rounded-xl border border-border/5 p-2 md:p-4 shadow-2xl overflow-hidden aspect-video md:aspect-[21/9]">
                <div className="w-full h-full bg-surface-lowest rounded-lg overflow-hidden flex border border-border/10">
                  {/* Sidebar Mock */}
                  <div className="w-16 md:w-20 bg-surface-lowest border-r border-border/10 h-full flex flex-col items-center py-6 gap-8">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                    </div>
                    {[FolderOpen, Insights, ShieldCheck].map((Icon, i) => (
                      <div key={i} className="w-8 h-8 rounded hover:bg-surface-high transition-colors flex items-center justify-center cursor-pointer">
                        <Icon className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    ))}
                  </div>
                  {/* Main Content Mock */}
                  <div className="flex-1 p-8 text-left space-y-6">
                    <div className="flex justify-between items-center mb-10">
                      <div className="h-6 w-48 bg-surface-high rounded-full animate-pulse" />
                      <div className="h-8 w-32 bg-primary/5 rounded-lg border border-primary/20 shadow-sm shadow-primary/10" />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { color: "bg-primary/20", width: "w-full" },
                        { color: "bg-primary-container/20", width: "w-2/3" },
                        { color: "bg-surface-highest/50", width: "w-full" }
                      ].map((card, i) => (
                        <div key={i} className="h-32 bg-surface-high/50 rounded-xl p-4 space-y-4 border border-border/5">
                          <div className={`h-2 w-12 ${card.color} rounded-full`} />
                          <div className={`h-3 ${card.width} bg-surface-highest rounded-full`} />
                          <div className="h-3 w-1/2 bg-surface-highest rounded-full opacity-50" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4 pt-4">
                      <div className="h-3 w-full bg-surface-lowest rounded-full border border-border/10" />
                      <div className="h-3 w-full bg-surface-lowest rounded-full border border-border/10" />
                      <div className="h-3 w-3/4 bg-surface-lowest rounded-full border border-border/10" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Feature Grid (Bento Style) */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Large Feature */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-8 glass rounded-3xl p-10 border border-border/5 flex flex-col justify-between min-h-[400px] hover:border-primary/20 transition-all"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-3xl font-bold mb-4">AI-Powered Insights</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                  Go beyond search. Our neural engine understands the context, nuance, and relationships within your documentation to surface exactly what matters.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {['Neural Analysis', 'Semantic Search', 'Vector Context'].map(tag => (
                  <span key={tag} className="px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Small Feature */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-4 glass rounded-3xl p-10 border border-border/5 flex flex-col justify-between hover:border-primary/20 transition-all"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-primary-container/10 flex items-center justify-center mb-8">
                  <ShieldCheck className="w-7 h-7 text-primary-container" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4">Secure Workspace</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Enterprise-grade encryption and isolated data nodes ensure your intelligence stays yours.
                </p>
              </div>
            </motion.div>

            {/* Full Width (Visual Split) */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-4 glass rounded-3xl p-10 border border-border/5 flex flex-col justify-between hover:border-primary/20 transition-all"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-surface-highest/50 flex items-center justify-center mb-8">
                  <Workflow className="w-7 h-7 text-foreground/50" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4">Role-Based Flow</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Dynamic permissions that adapt to your team structure without rigid hierarchies.
                </p>
              </div>
            </motion.div>

            <div className="md:col-span-8 bg-surface-low rounded-3xl p-1 overflow-hidden group shadow-2xl">
              <div className="w-full h-full rounded-[23px] relative overflow-hidden flex items-center justify-center bg-surface-high/50">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000')] bg-cover bg-center mix-blend-overlay opacity-20 transition-transform duration-700 group-hover:scale-110" />
                <div className="relative z-10 text-center px-10">
                  <h4 className="font-display text-2xl font-bold mb-2">Automated Governance</h4>
                  <p className="text-muted-foreground">Continuous compliance monitoring across every byte.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Showcase */}
        <section id="intelligence" className="py-32 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-foreground">
            <div className="text-center mb-20 space-y-4">
              <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">Neural Document Intelligence</h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                Sophisticated AI that doesn't just read—it understands, categorizes, and protects your document ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Brain,
                  title: "Semantic Understanding",
                  desc: "Identify relationships and entities across fragmented documentation sets with contextual precision.",
                  tags: ["NER", "Relationship Mapping"]
                },
                {
                  icon: Cpu,
                  title: "OCR Engine Pro",
                  desc: "High-fidelity extraction from legacy scans, complex tables, and handwritten annotations.",
                  tags: ["Multimodal", "Structure Aware"]
                },
                {
                  icon: Sparkles,
                  title: "Auto-Curator",
                  desc: "Intelligent sorting and metadata generation that eliminates manual document tagging forever.",
                  tags: ["Auto-Tagging", "Taxonomy"]
                }
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-8 rounded-3xl border border-border/5 hover:border-primary/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-display">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{item.desc}</p>
                  <div className="flex gap-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-primary/60 px-2 py-1 rounded bg-primary/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Background Highlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />
        </section>

        {/* Value Prop (No-Line Split) */}
        <section className="py-32 bg-surface-lowest relative overflow-hidden border-y border-border/5">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="font-display text-4xl md:text-5xl font-extrabold leading-tight">
                The "No-Line" <br />Philosophy of Design
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that productivity is found in focus, not clutter. Our interface rejects traditional borders and rigid grids in favor of tonal layering. By using depth and color shifts, we guide your eyes naturally to the insights that matter, reducing cognitive load and visual fatigue.
              </p>
              <div className="flex items-center gap-12 pt-4">
                <div className="flex flex-col">
                  <span className="font-display text-4xl font-extrabold text-primary">85%</span>
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Reduced Visual Noise</span>
                </div>
                <div className="w-px h-12 bg-border/20" />
                <div className="flex flex-col">
                  <span className="font-display text-4xl font-extrabold text-primary-container">2.4x</span>
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Faster Retrieval</span>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Efficiency Visualization */}
              <div className="bg-surface-high/30 backdrop-blur-md rounded-3xl p-8 border border-border/10 shadow-3xl">
                <div className="flex items-end gap-3 h-64 mb-8">
                  {[40, 55, 45, 95, 60, 50].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 1 }}
                        className={`w-full rounded-t-xl transition-all relative ${h === 95 ? 'bg-primary shadow-[0_-8px_24px_-4px_rgba(173,198,255,0.4)]' : 'bg-surface-highest hover:bg-primary/40 cursor-help'}`}
                      >
                        {h === 95 && (
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl">
                            1-glance Performance
                          </div>
                        )}
                      </motion.div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                  <span>Processing Volume</span>
                  <span>Intelligence Level</span>
                </div>
              </div>
              {/* Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[60px] rounded-full -z-10" />
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-6 relative text-foreground">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
                Pay once, unlock <span className="text-primary italic">clarity.</span>
              </h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                Transform document chaos into structured intelligence. Efficient plans for every stage of growth.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 pt-8">
                <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-14 h-7 rounded-full bg-surface-highest/20 border border-border/10 relative p-1 transition-all cursor-pointer"
                >
                  <motion.div
                    animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                    className="w-5 h-5 rounded-full bg-primary shadow-lg shadow-primary/40"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>Annually</span>
                  <span className="bg-primary-container/20 text-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary-container/30">
                    -20%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Lite",
                  icon: Leaf,
                  monthlyPrice: 20,
                  yearlyPrice: 16,
                  desc: "Perfect for niche builders and researchers.",
                  usage: "for up to 500 documents",
                  features: ["Semantic search", "Basic PII masking", "Community support", "1.5 GB Storage"],
                  cta: "Try 7 days for free",
                  popular: false
                },
                {
                  name: "Premium",
                  icon: Diamond,
                  monthlyPrice: 65,
                  yearlyPrice: 52,
                  desc: "The standard for professionals and agencies.",
                  usage: "for up to 5,000 documents",
                  features: ["Unlimited OCR engine", "Automated redaction", "Advanced relationship mapping", "Custom metadata tagging", "Priority 24/7 support"],
                  cta: "Get started",
                  popular: true
                },
                {
                  name: "Enterprise",
                  icon: Crown,
                  monthlyPrice: 120,
                  yearlyPrice: 96,
                  desc: "Mission-critical infrastructure for the modern org.",
                  usage: "for mid to big agencies",
                  features: ["Dedicated compute nodes", "Custom AI fine-tuning", "SSO & SAML integration", "Audit logs & compliance repo", "Dedicated account manager"],
                  cta: "Get started",
                  popular: false
                }
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`relative glass p-10 rounded-3xl border transition-all duration-500 flex flex-col ${tier.popular ? 'border-primary/30 shadow-2xl shadow-primary/10 scale-105 z-10 bg-surface-highest/5' : 'border-border/5 opacity-80 hover:opacity-100 hover:border-border/10'}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                      Recommended
                    </div>
                  )}
                  <div className="mb-8">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${tier.popular ? 'bg-primary/20 text-primary' : 'bg-surface-highest/10 text-muted-foreground'}`}>
                      <tier.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-3xl font-bold font-display tracking-tight mb-2">{tier.name}</h4>
                    <p className="text-xs text-muted-foreground font-medium mb-8 leading-relaxed h-10">{tier.desc}</p>

                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold font-display">
                        ${billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">/ mo</span>
                        <span className="text-[10px] text-primary/60 font-medium italic">{tier.usage}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/signup"
                    className={`w-full block text-center py-4 rounded-xl font-bold transition-all shadow-lg mb-10 ${tier.popular ? 'bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02]' : 'bg-surface-highest/50 text-foreground hover:bg-surface-highest'}`}
                  >
                    {tier.cta}
                  </Link>

                  <ul className="space-y-4 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-muted-foreground leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.popular && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-bottom-left" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-3xl mx-auto"
          >
            <h2 className="font-display text-4xl md:text-6xl font-extrabold mb-8 tracking-tighter">Ready to experience clarity?</h2>
            <p className="text-xl text-muted-foreground mb-12">
              Join forward-thinking enterprise teams who use 1-glance to turn static documents into dynamic intelligence engines.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary text-xl px-12 py-5 rounded-md shadow-2xl shadow-primary/30">
                Initialize Free Workspace
              </Link>
            </div>
          </motion.div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 px-6 bg-surface-lowest/50 text-foreground border-y border-border/5">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-primary">Our Vision</h2>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
            >
              We empower the <span className="italic text-primary">Digital Curator</span> within every enterprise team.
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed"
            >
              1-glance was born from a simple realization: information isn't power—retrieval is. Our mission is to eliminate the friction between data and decision-making, providing a sophisticated layer of intelligence that organizes the world's most complex document ecosystems.
            </motion.p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-20 bg-surface-lowest border-t border-border/5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div className="space-y-6 max-w-xs">
              <img src={logoFull} alt="1-glance" className="h-8 md:h-10 origin-left object-contain opacity-80" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Empowering the digital curator through sophisticated document intelligence and role-based excellence.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
              {[
                {
                  title: 'Platform', links: [
                    { label: 'Intelligence', href: '#intelligence' },
                    { label: 'PII Redaction', href: '#features' },
                    { label: 'Role-Based Flow', href: '#features' }
                  ]
                },
                {
                  title: 'Governance', links: [
                    { label: 'Security', href: '#features' },
                    { label: 'Compliance', href: '#features' },
                    { label: 'GDPR', href: '#features' }
                  ]
                },
                {
                  title: 'Company', links: [
                    { label: 'About Us', href: '#about' },
                    { label: 'Pricing', href: '#pricing' },
                    { label: 'Contact', href: '#' }
                  ]
                }
              ].map(group => (
                <div key={group.title}>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">{group.title}</h4>
                  <ul className="space-y-4">
                    {group.links.map(link => (
                      <li key={link.label}>
                        <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-border/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            <p>© {new Date().getFullYear()} Alonix Intelligence Systems. The Digital Curator.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Twitter</a>
              <a href="#" className="hover:text-primary transition-colors">Enterprise</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

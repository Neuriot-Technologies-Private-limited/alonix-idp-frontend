import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  PlayCircle,
  ShieldCheck,
  Workflow,
  Sparkles,
  Brain,
  Cpu,
} from 'lucide-react';
import BrandHomeLink from '../../components/branding/BrandHomeLink';
import { BillingCycleToggle } from '../../components/admin/BillingCycleToggle';
import PublicPricingGrid, { discountPercentFromPlans } from '../../components/billing/PublicPricingGrid';
import { ProductScreenshotFrame } from '../../components/landing/ProductScreenshotFrame';
import { ProductShowcaseSection } from '../../components/landing/ProductShowcaseSection';
import { NoLinePhilosophyVisual } from '../../components/landing/NoLinePhilosophyVisual';
import {
  PRODUCT_SCREEN_ASPECT,
  PRODUCT_SCREEN_POSITION,
} from '../../components/landing/productScreens';
import dashboardShot from '../../assets/landing/product-dashboard.png';
import { fetchBillingPlans } from '../../services/billingService';
import type { BillingCycle } from '../../utils/billingUtils';

const LandingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('monthly');

  const { data: plans = [], isLoading: plansLoading, isError: plansError } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchBillingPlans,
    staleTime: 5 * 60_000,
  });
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
          <BrandHomeLink />

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground font-display">
            <a href="#product" className="hover:text-primary transition-colors">Product</a>
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

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="relative w-full max-w-6xl mx-auto group"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/25 via-violet/15 to-primary-container/20 rounded-3xl blur-2xl opacity-40 group-hover:opacity-55 transition duration-700" />
              <div className="relative rounded-2xl border border-border/10 shadow-2xl overflow-hidden">
                <ProductScreenshotFrame
                  src={dashboardShot}
                  alt="Alonix IDP dashboard — document trends, workspaces, and activity"
                  pathLabel="app.alonix.ai/users"
                  priority
                  imageAspect={PRODUCT_SCREEN_ASPECT}
                  imagePosition={PRODUCT_SCREEN_POSITION}
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        <ProductShowcaseSection />

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

            <motion.a
              href="#product"
              whileHover={{ y: -4 }}
              className="md:col-span-8 rounded-3xl p-1 overflow-hidden group shadow-2xl border border-border/10 bg-surface-low block"
            >
              <div className="rounded-[23px] overflow-hidden relative">
                <img
                  src={dashboardShot}
                  alt=""
                  aria-hidden
                  className="w-full h-48 md:h-56 object-cover object-top object-left bg-[#070b14] transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h4 className="font-display text-2xl font-bold mb-2">See the full product tour</h4>
                  <p className="text-muted-foreground text-sm">Dashboard metrics and document Q&A — switch views below.</p>
                </div>
              </div>
            </motion.a>
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
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <NoLinePhilosophyVisual />
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

              <div className="flex justify-center pt-8">
                <BillingCycleToggle
                  cycle={billingCycle}
                  onChange={setBillingCycle}
                  discountPercent={discountPercentFromPlans(plans)}
                />
              </div>
            </div>

            <PublicPricingGrid
              plans={plans}
              cycle={billingCycle}
              isLoading={plansLoading}
              error={plansError}
              ctaHref="/signup"
              ctaLabel="Get started"
            />

            <p className="text-center mt-10">
              <Link to="/pricing" className="text-sm font-bold text-primary hover:underline">
                Compare all plans →
              </Link>
            </p>
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
              <BrandHomeLink imgClassName="h-8 md:h-10 origin-left object-contain opacity-80 hover:opacity-100 transition-opacity" />
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

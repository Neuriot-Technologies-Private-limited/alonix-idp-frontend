import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { useBrand } from '../../brand/useBrand';

const LandingPage: React.FC = () => {
  const { t } = useTranslation('landing');
  const brand = useBrand();
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
            <a href="#product" className="hover:text-primary transition-colors">{t('hero.headline', { ns: 'common', defaultValue: 'Product' })}</a>
            <a href="#features" className="hover:text-primary transition-colors">{t('nav.solutions', { ns: 'common', defaultValue: 'Solutions' })}</a>
            <a href="#intelligence" className="hover:text-primary transition-colors">{t('nav.intelligence', { ns: 'common', defaultValue: 'Intelligence' })}</a>
            <Link to="/pricing" className="hover:text-primary transition-colors">{t('nav.pricing', { ns: 'common', defaultValue: 'Pricing' })}</Link>
            <a href="#about" className="hover:text-primary transition-colors">{t('nav.about', { ns: 'common', defaultValue: 'About' })}</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold hover:text-primary transition-colors px-4 font-display">{t('nav.login', { ns: 'common', defaultValue: 'Login' })}</Link>
            <Link
              to="/signup"
              className="btn-primary py-2.5 px-6 rounded-md text-sm font-bold shadow-lg shadow-primary/20 font-display"
            >
              {t('nav.signUp', { ns: 'common', defaultValue: 'Sign Up' })}
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
              {t('hero.headline')} <br />
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#ADC6FF] bg-clip-text text-transparent">
                {t('hero.headlineHighlight')}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              {t('hero.subheadline')}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col md:flex-row gap-6 justify-center items-center mb-20"
            >
              <Link to="/signup" className="w-full md:w-auto btn-primary text-lg px-8 py-4 rounded-md shadow-xl shadow-primary/25">
                {t('actions.getStartedFree', { ns: 'common', defaultValue: 'Get Started for Free' })}
              </Link>
              <button className="w-full md:w-auto glass hover:bg-surface-highest/20 text-primary font-bold text-lg px-8 py-4 rounded-md flex items-center justify-center gap-3 transition-all active:scale-95 group">
                <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {t('actions.watchProductTour', { ns: 'common', defaultValue: 'Watch Product Tour' })}
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
                  alt={t('product.screenshotAlt', { brandName: brand.name })}
                  pathLabel={t('product.pathLabel')}
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
                <h3 className="font-display text-3xl font-bold mb-4">{t('features.aiInsights.title')}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
                  {t('features.aiInsights.description')}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {(t('features.aiInsights.tags', { returnObjects: true }) as string[]).map(tag => (
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
                <h3 className="font-display text-2xl font-bold mb-4">{t('features.secureWorkspace.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.secureWorkspace.description')}
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
                <h3 className="font-display text-2xl font-bold mb-4">{t('features.roleBasedFlow.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.roleBasedFlow.description')}
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
                  <h4 className="font-display text-2xl font-bold mb-2">{t('features.productTour.title')}</h4>
                  <p className="text-muted-foreground text-sm">{t('features.productTour.subtitle')}</p>
                </div>
              </div>
            </motion.a>
          </div>
        </section>

        {/* Intelligence Showcase */}
        <section id="intelligence" className="py-32 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto text-foreground">
            <div className="text-center mb-20 space-y-4">
              <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">{t('intelligence.sectionTitle')}</h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                {t('intelligence.sectionSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {([
                { icon: Brain, key: 'semantic' },
                { icon: Cpu, key: 'ocr' },
                { icon: Sparkles, key: 'curator' },
              ] as const).map(({ icon: Icon, key }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-8 rounded-3xl border border-border/5 hover:border-primary/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-display">{t(`intelligence.items.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t(`intelligence.items.${key}.description`)}</p>
                  <div className="flex gap-2">
                    {(t(`intelligence.items.${key}.tags`, { returnObjects: true }) as string[]).map(tag => (
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
                {t('philosophy.title')} <br />{t('philosophy.titleLine2')}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('philosophy.description')}
              </p>
              <div className="flex items-center gap-12 pt-4">
                <div className="flex flex-col">
                  <span className="font-display text-4xl font-extrabold text-primary">{t('philosophy.stat1Value')}</span>
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">{t('philosophy.stat1Label')}</span>
                </div>
                <div className="w-px h-12 bg-border/20" />
                <div className="flex flex-col">
                  <span className="font-display text-4xl font-extrabold text-primary-container">{t('philosophy.stat2Value')}</span>
                  <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">{t('philosophy.stat2Label')}</span>
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
                {t('pricing.title')} <span className="text-primary italic">{t('pricing.titleHighlight')}</span>
              </h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                {t('pricing.subtitle')}
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
              ctaLabel={t('actions.getStarted', { ns: 'common', defaultValue: 'Get started' })}
            />

            <p className="text-center mt-10">
              <Link to="/pricing" className="text-sm font-bold text-primary hover:underline">
                {t('actions.compareAllPlans', { ns: 'common', defaultValue: 'Compare all plans →' })}
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
            <h2 className="font-display text-4xl md:text-6xl font-extrabold mb-8 tracking-tighter">{t('cta.title')}</h2>
            <p className="text-xl text-muted-foreground mb-12">
              {t('cta.description', { brandName: brand.name })}
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary text-xl px-12 py-5 rounded-md shadow-2xl shadow-primary/30">
                {t('actions.initializeWorkspace', { ns: 'common', defaultValue: 'Initialize Free Workspace' })}
              </Link>
            </div>
          </motion.div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 px-6 bg-surface-lowest/50 text-foreground border-y border-border/5">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-primary">{t('about.visionLabel')}</h2>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
            >
              {t('about.title')} <span className="italic text-primary">{t('about.titleHighlight')}</span> {t('about.titleSuffix')}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed"
            >
              {t('about.story', { brandName: brand.name })}
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
                {t('footer.tagline')}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
              {[
                {
                  title: t('footer.platform', { ns: 'common', defaultValue: 'Platform' }), links: [
                    { label: t('footer.intelligence', { ns: 'common', defaultValue: 'Intelligence' }), href: '#intelligence' },
                    { label: t('footer.piiRedaction', { ns: 'common', defaultValue: 'PII Redaction' }), href: '#features' },
                    { label: t('footer.roleBasedFlow', { ns: 'common', defaultValue: 'Role-Based Flow' }), href: '#features' }
                  ]
                },
                {
                  title: t('footer.governance', { ns: 'common', defaultValue: 'Governance' }), links: [
                    { label: t('footer.security', { ns: 'common', defaultValue: 'Security' }), href: '#features' },
                    { label: t('footer.compliance', { ns: 'common', defaultValue: 'Compliance' }), href: '#features' },
                    { label: t('footer.gdpr', { ns: 'common', defaultValue: 'GDPR' }), href: '#features' }
                  ]
                },
                {
                  title: t('footer.company', { ns: 'common', defaultValue: 'Company' }), links: [
                    { label: t('footer.aboutUs', { ns: 'common', defaultValue: 'About Us' }), href: '#about' },
                    { label: t('nav.pricing', { ns: 'common', defaultValue: 'Pricing' }), href: '#pricing' },
                    { label: t('footer.contact', { ns: 'common', defaultValue: 'Contact' }), href: '#' }
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
            <p>{t('footer.copyright', { year: new Date().getFullYear(), copyright: brand.copyright })}</p>
            <div className="flex gap-8">
              <a href={brand.privacyUrl} className="hover:text-primary transition-colors">{t('footer.privacyPolicy', { ns: 'common', defaultValue: 'Privacy Policy' })}</a>
              <a href={brand.termsUrl} className="hover:text-primary transition-colors">{t('footer.termsOfService', { ns: 'common', defaultValue: 'Terms of Service' })}</a>
              <a href="#" className="hover:text-primary transition-colors">{t('footer.twitter', { ns: 'common', defaultValue: 'Twitter' })}</a>
              <a href="#" className="hover:text-primary transition-colors">{t('footer.enterprise', { ns: 'common', defaultValue: 'Enterprise' })}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

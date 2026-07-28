import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useBrand } from '../../brand/useBrand';
import { ProductScreenshotFrame } from './ProductScreenshotFrame';
import {
  PRODUCT_SCREENS,
  PRODUCT_SCREEN_ASPECT,
  PRODUCT_SCREEN_POSITION,
  type ProductScreenId,
} from './productScreens';

export const ProductShowcaseSection: React.FC = () => {
  const { t } = useTranslation('landing');
  const brand = useBrand();
  const [view, setView] = React.useState<ProductScreenId>('dashboard');
  const active = PRODUCT_SCREENS.find((v) => v.id === view) ?? PRODUCT_SCREENS[0];

  return (
    <section id="product" className="relative py-28 px-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(59,130,246,0.08),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
            {t('product.showcaseEyebrow')}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {t('product.showcaseTitleBefore')}{' '}
            <span className="text-primary italic">{t('product.showcaseTitleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            {t('product.showcaseDescription', { brandName: brand.name })}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-stretch">
          <div className="lg:w-[300px] shrink-0 w-full">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 [scrollbar-width:thin]">
              {PRODUCT_SCREENS.map((v) => {
                const selected = view === v.id;
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setView(v.id)}
                    className={cn(
                      'flex min-w-[200px] lg:min-w-0 lg:w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all shrink-0',
                      selected
                        ? 'border-primary/35 bg-primary/10 text-foreground shadow-lg shadow-primary/10'
                        : 'border-border/10 bg-surface-highest/5 text-muted-foreground hover:border-border/25 hover:bg-surface-highest/10',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl shrink-0',
                        selected ? 'bg-primary/20 text-primary' : 'bg-surface-highest/20',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold truncate">{v.label}</span>
                      <span className="block text-[11px] opacity-70 mt-0.5 leading-snug line-clamp-2">
                        {v.blurb}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0 w-full relative">
            <div className="pointer-events-none absolute -inset-3 bg-gradient-to-r from-primary/15 via-violet/10 to-transparent rounded-3xl blur-2xl opacity-50" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative"
              >
                <ProductScreenshotFrame
                  src={active.src}
                  alt={active.alt}
                  pathLabel={active.path}
                  imageAspect={PRODUCT_SCREEN_ASPECT}
                  imagePosition={PRODUCT_SCREEN_POSITION}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcaseSection;

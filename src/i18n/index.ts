/**
 * i18n initialisation — import this ONCE in src/main.tsx before rendering.
 *
 * Architecture:
 *  - Base strings live in src/i18n/locales/<lng>/<ns>.json
 *  - Brand overrides live in brands/<brand>/i18n/<lng>/<ns>.json
 *  - Brand strings are merged at build time by vite.config.ts (brand plugin)
 *    into src/i18n/locales/<lng>/<ns>.json, so we only need one load path here.
 *
 * Adding a new language:
 *  1. Create src/i18n/locales/<lng>/*.json
 *  2. Import the bundles below and add them to `resources`
 *  3. Add the language code to the `supportedLngs` array
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Base English bundles
import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enAuth from './locales/en/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        landing: enLanding,
        auth: enAuth,
      },
    },
    // Default namespace — used when no namespace prefix given to t()
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    interpolation: {
      // React already escapes values, no need for i18next escaping
      escapeValue: false,
    },
    detection: {
      // Check localStorage first, then browser language header
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;

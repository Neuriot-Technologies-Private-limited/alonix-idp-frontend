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
import enDashboard from './locales/en/dashboard.json';
import enChat from './locales/en/chat.json';
import enProfile from './locales/en/profile.json';
import enOrgSettings from './locales/en/orgSettings.json';
import enBilling from './locales/en/billing.json';
import enUsers from './locales/en/users.json';
import enDocuments from './locales/en/documents.json';
import enGroups from './locales/en/groups.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        landing: enLanding,
        auth: enAuth,
        dashboard: enDashboard,
        chat: enChat,
        profile: enProfile,
        orgSettings: enOrgSettings,
        billing: enBilling,
        users: enUsers,
        documents: enDocuments,
        groups: enGroups,
      },
    },
    // Default namespace — used when no namespace prefix given to t()
    defaultNS: 'common',
    ns: ['common', 'landing', 'auth', 'dashboard', 'chat', 'profile', 'orgSettings', 'billing', 'users', 'documents', 'groups'],
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

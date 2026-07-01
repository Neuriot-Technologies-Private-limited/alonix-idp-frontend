import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {isSubpathDeploy, sitePath} = require('./scripts/site-paths') as {
  isSubpathDeploy: () => boolean;
  sitePath: (path: string) => string;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {applyBrandTokens, resolveBrandSlug, loadBrandEnv, toBrandConfig} =
  require('./scripts/brand-env') as typeof import('./scripts/brand-env');

const apiMode = process.env.DOCUSAURUS_API_MODE ?? 'mock';
const mockUrl = process.env.DOCUSAURUS_API_MOCK_URL ?? 'http://localhost:4010';
const sandboxUrl =
  process.env.DOCUSAURUS_API_SANDBOX_URL ?? 'http://localhost:5005/api';

const siteUrl =
  process.env.DOCUSAURUS_SITE_URL?.trim() || 'http://localhost:3000';
const baseUrl = process.env.DOCUSAURUS_BASE_URL?.trim() || '/';
const routeBasePath = isSubpathDeploy() ? '/' : 'docs';

function loadBrand() {
  const generatedPath = path.join(__dirname, '.brand.generated.json');
  if (fs.existsSync(generatedPath)) {
    return JSON.parse(fs.readFileSync(generatedPath, 'utf8')) as ReturnType<
      typeof toBrandConfig
    >;
  }
  const slug = resolveBrandSlug();
  const env = loadBrandEnv(slug);
  const brandStaticDir = path.join(__dirname, 'static', 'brand');
  return toBrandConfig(slug, env, brandStaticDir);
}

const brand = loadBrand();
const docsTagline = `Learn how to use ${brand.name} — workspaces, documents, AI, and more`;

const config: Config = {
  title: brand.helpCenterTitle,
  tagline: docsTagline,
  favicon: brand.faviconPath,

  url: siteUrl,
  baseUrl,

  organizationName: brand.slug,
  projectName: `${brand.slug}-docs`,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    preprocessor: ({fileContent}) => applyBrandTokens(fileContent, brand),
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath,
        },
        blog: false,
        theme: {
          customCss: ['./src/css/custom.css', './src/css/brand-theme.generated.css'],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: brand.navbarTitle,
      logo: {
        alt: brand.name,
        src: brand.logoPath,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: sitePath('/getting-started/creating-account'),
          label: 'Quick Start',
          position: 'left',
        },
        {
          to: sitePath('/faq'),
          label: 'FAQ',
          position: 'left',
        },
        {
          to: sitePath('/developer/api-reference'),
          label: 'API Reference',
          position: 'left',
        },
        {
          to: sitePath('/api-playground'),
          label: 'API Playground',
          position: 'left',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: `What is ${brand.name}?`,
              to: sitePath('/introduction/product-overview'),
            },
            {label: 'Getting Started', to: sitePath('/getting-started/creating-account')},
            {label: 'User Guide', to: sitePath('/user-guide/dashboard')},
            {label: 'Tutorials', to: sitePath('/tutorials/first-workspace')},
          ],
        },
        {
          title: 'Support',
          items: [
            {label: 'FAQ', to: sitePath('/faq')},
            {label: 'Troubleshooting', to: sitePath('/troubleshooting/common-issues')},
            {label: 'Glossary', to: sitePath('/glossary/terms')},
          ],
        },
        {
          title: 'Developers',
          items: [
            {label: 'API Reference', to: sitePath('/developer/api-reference')},
            {label: 'API Playground', to: sitePath('/api-playground')},
            {label: 'Authentication', to: sitePath('/developer/authentication')},
            {label: 'Developer Setup', to: sitePath('/developer/setup')},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ${brand.copyright}. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
  },

  customFields: {
    apiMode,
    mockUrl,
    sandboxUrl,
    brand,
  },
};

export default config;

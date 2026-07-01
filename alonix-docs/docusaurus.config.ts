import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {isSubpathDeploy, sitePath} = require('./scripts/site-paths') as {
  isSubpathDeploy: () => boolean;
  sitePath: (path: string) => string;
};

const apiMode = process.env.DOCUSAURUS_API_MODE ?? 'mock';
const mockUrl = process.env.DOCUSAURUS_API_MOCK_URL ?? 'http://localhost:4010';
const sandboxUrl =
  process.env.DOCUSAURUS_API_SANDBOX_URL ?? 'http://localhost:5005/api';

const siteUrl =
  process.env.DOCUSAURUS_SITE_URL?.trim() || 'http://localhost:3000';
const baseUrl = process.env.DOCUSAURUS_BASE_URL?.trim() || '/';
const routeBasePath = isSubpathDeploy() ? '/' : 'docs';

const config: Config = {
  title: 'Alonix Help Center',
  tagline: 'Learn how to use Alonix — workspaces, documents, AI, and more',
  favicon: 'img/favicon.ico',

  url: siteUrl,
  baseUrl,

  organizationName: 'alonix',
  projectName: 'alonix-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
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
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/alonix-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Alonix Help',
      logo: {
        alt: 'Alonix',
        src: 'img/logo.svg',
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
            {label: 'What is Alonix?', to: sitePath('/introduction/what-is-alonix')},
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
      copyright: `Copyright © ${new Date().getFullYear()} Alonix. All rights reserved.`,
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
  },
};

export default config;

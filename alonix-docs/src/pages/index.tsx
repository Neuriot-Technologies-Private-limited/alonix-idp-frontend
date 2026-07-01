import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {useBrand} from '@site/src/brand/useBrand';

import styles from './index.module.css';
import {sitePath as sp} from '@site/src/utils/sitePath';

const quickStart = [
  {
    title: 'Create your account',
    description: 'Sign up, verify your email, and log in to your organization.',
    link: sp('/getting-started/creating-account'),
  },
  {
    title: 'Set up a workspace',
    description: 'Create a group (workspace) where your team stores documents.',
    link: sp('/tutorials/first-workspace'),
  },
  {
    title: 'Upload your first document',
    description: 'Add files and run the ingestion pipeline.',
    link: sp('/tutorials/upload-document'),
  },
  {
    title: 'Ask AI a question',
    description: 'Chat with your documents using the AI assistant.',
    link: sp('/tutorials/ask-ai'),
  },
];

const popularGuides = [
  {title: 'Documents & pipeline', link: sp('/user-guide/documents')},
  {title: 'AI Chat', link: sp('/user-guide/ai-chat')},
  {title: 'Invite team members', link: sp('/tutorials/invite-team')},
  {title: 'Users & roles', link: sp('/user-guide/users-and-roles')},
  {title: 'Connectors', link: sp('/user-guide/connectors')},
  {title: 'Reports', link: sp('/user-guide/reports')},
];

const featureCategories = [
  {
    title: 'Work & organize',
    items: ['Workspaces (Groups)', 'Documents vault', 'Document pipeline', 'Connectors'],
    link: sp('/user-guide/workspaces'),
  },
  {
    title: 'Intelligence',
    items: ['AI Chat (RAG)', 'Source citations', 'Clarification questions'],
    link: sp('/user-guide/ai-chat'),
  },
  {
    title: 'Governance',
    items: ['Activity logs', 'Reports & exports', 'Sensitivity levels', 'Audit trail'],
    link: sp('/user-guide/activity-logs'),
  },
  {
    title: 'Administration',
    items: ['User management', 'Org settings', 'Billing (SaaS)', 'Profile'],
    link: sp('/user-guide/org-settings'),
  },
];

const faqPreview = [
  {
    q: 'What is a workspace vs. a group?',
    a: 'They are the same thing. The app menu says Groups; this help center uses workspace when explaining concepts.',
    link: sp('/glossary/terms#workspace'),
  },
  {
    q: 'Why is my document stuck in Processing?',
    a: 'The ingest, extract, or classify step may still be running. See pipeline status on the Documents page.',
    link: sp('/troubleshooting/upload-problems'),
  },
  {
    q: 'Who can invite users?',
    a: 'Company admins and group (workspace) admins can send invitations.',
    link: sp('/user-guide/users-and-roles'),
  },
];

function FeatureCard({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Link to={link} className={clsx('card', styles.featureCard)}>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
      <span className={styles.cardLink}>Read guide →</span>
    </Link>
  );
}

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const brand = useBrand();

  return (
    <Layout
      title={brand.helpCenterTitle}
      description={`Complete user documentation for ${brand.name} — intelligent document platform with AI chat, connectors, and governance.`}>
      <header className={clsx('hero', styles.heroBanner)}>
        <div className="container">
          <Heading as="h1" className="hero__title">
            {siteConfig.title}
          </Heading>
          <p className="hero__subtitle">
            Everything you need to use {brand.name} confidently — from your first login to advanced
            reports and connectors.
          </p>
          <div className={styles.heroCtas}>
            <Link className="button button--primary button--lg" to={sp('/getting-started/creating-account')}>
              Get started
            </Link>
            <Link className="button button--secondary button--lg" to={sp('/introduction/product-overview')}>
              What is {brand.name}?
            </Link>
          </div>
          <p className={styles.searchHint}>
            Tip: Press <kbd>Ctrl</kbd>+<kbd>K</kbd> (or <kbd>⌘</kbd>+<kbd>K</kbd>) to search all
            documentation.
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={clsx('container', styles.section)}>
          <Heading as="h2">Quick start</Heading>
          <p className={styles.sectionLead}>
            New to {brand.name}? Follow these four steps to go from signup to your first AI answer.
          </p>
          <div className={styles.grid4}>
            {quickStart.map((item, i) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className={clsx('container', styles.section, styles.sectionAlt)}>
          <Heading as="h2">Popular guides</Heading>
          <div className={styles.linkGrid}>
            {popularGuides.map((g) => (
              <Link key={g.link} to={g.link} className={styles.popularLink}>
                {g.title}
              </Link>
            ))}
          </div>
        </section>

        <section className={clsx('container', styles.section)}>
          <Heading as="h2">Explore by topic</Heading>
          <div className={styles.grid4}>
            {featureCategories.map((cat) => (
              <div key={cat.title} className={clsx('card', styles.categoryCard)}>
                <Heading as="h3">
                  <Link to={cat.link}>{cat.title}</Link>
                </Heading>
                <ul>
                  {cat.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={clsx('container', styles.section, styles.sectionAlt)}>
          <Heading as="h2">Tutorials</Heading>
          <p className={styles.sectionLead}>
            Step-by-step workflows from start to finish.
          </p>
          <div className={styles.linkGrid}>
            <Link to={sp('/tutorials/first-workspace')} className={styles.popularLink}>
              Create your first workspace
            </Link>
            <Link to={sp('/tutorials/upload-document')} className={styles.popularLink}>
              Upload your first document
            </Link>
            <Link to={sp('/tutorials/invite-team')} className={styles.popularLink}>
              Invite team members
            </Link>
            <Link to={sp('/tutorials/ask-ai')} className={styles.popularLink}>
              Ask AI questions
            </Link>
            <Link to={sp('/tutorials/generate-report')} className={styles.popularLink}>
              Generate reports
            </Link>
            <Link to={sp('/tutorials/connector-ingest')} className={styles.popularLink}>
              Ingest from connectors
            </Link>
          </div>
        </section>

        <section className={clsx('container', styles.section)}>
          <Heading as="h2">Frequently asked questions</Heading>
          <div className={styles.faqList}>
            {faqPreview.map((item) => (
              <div key={item.q} className={styles.faqItem}>
                <Heading as="h3">{item.q}</Heading>
                <p>{item.a}</p>
                <Link to={item.link}>Learn more →</Link>
              </div>
            ))}
          </div>
          <Link className="button button--outline button--primary" to={sp('/faq')}>
            View all FAQ
          </Link>
        </section>

        <section className={clsx('container', styles.section, styles.sectionAlt)}>
          <Heading as="h2">Recently updated</Heading>
          <ul className={styles.recentList}>
            <li>
              <Link to={sp('/user-guide/connectors')}>Connectors — Email, SFTP, SharePoint</Link>
            </li>
            <li>
              <Link to={sp('/user-guide/document-pipeline')}>Document pipeline (ingest, extract, classify)</Link>
            </li>
            <li>
              <Link to={sp('/release-notes/recent-updates')}>Release notes</Link>
            </li>
          </ul>
        </section>
      </main>
    </Layout>
  );
}

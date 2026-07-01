---
title: System Requirements
description: Browser, network, and device requirements for using {{brandName}} in production and during evaluation.
sidebar_position: 1
---

# System Requirements

## Overview

{{brandName}} runs entirely in your web browser. There is no desktop installer required for end users. This page lists what you need for a smooth experience.

## Purpose

Verify your environment before signup or rollout so users avoid browser compatibility issues, slow uploads, or blocked network access.

## Prerequisites

- Ability to install or update a modern web browser (if your current version is outdated)
- Network access approved by your IT team (for SaaS or on-prem URLs)

## Step-by-Step Instructions

### 1. Use a supported browser

| Browser | Minimum version |
|---------|-----------------|
| Google Chrome | Latest two major versions |
| Microsoft Edge | Latest two major versions |
| Mozilla Firefox | Latest two major versions |
| Safari (macOS / iOS) | Latest two major versions |

:::warning Internet Explorer is not supported
{{brandName}} requires a modern browser with JavaScript enabled.
:::

### 2. Enable cookies and JavaScript

{{brandName}} uses secure session cookies for login. Ensure your browser:

- Has JavaScript enabled
- Allows cookies for your {{brandName}} domain
- Is not blocking third-party scripts required by your SSO provider (if applicable)

### 3. Check network requirements

| Requirement | Details |
|-------------|---------|
| HTTPS | Production {{brandName}} is served over HTTPS. Do not bypass certificate warnings. |
| Firewall | Allow outbound HTTPS to your {{brandName}} URL (SaaS or company-hosted). |
| File upload size | Large uploads may take longer on slow connections. Contact your admin for org limits. |
| Connectors | Email, SFTP, and SharePoint connectors run server-side; end users only need browser access. |

### 4. Recommended device specs

| Device | Recommendation |
|--------|----------------|
| Desktop / laptop | 8 GB RAM or more for heavy PDF viewing and AI Chat |
| Tablet | Supported; some admin screens are easier on desktop |
| Mobile | Supported for search and chat; admin tasks best on larger screens |
| Display | 1280×720 minimum; 1920×1080 recommended for dashboards |

[Screenshot – {{brandName}} login page displayed correctly in a supported browser]

## Expected Results

Your device and network meet {{brandName}} requirements. You can proceed to [Creating Your Account](/docs/getting-started/creating-account) or [Logging In](/docs/getting-started/logging-in).

## Tips

- Use a wired or stable Wi‑Fi connection when uploading large document batches.
- If your company uses a VPN, test {{brandName}} both on and off VPN during pilot rollout.
- Keep your browser updated—security patches also improve compatibility.

## Best Practices

- Standardize on one supported browser for your team during onboarding.
- Whitelist your {{brandName}} URL in corporate proxy and DLP tools before go-live.
- Document internal upload size limits in your workspace governance guide.

## Common Mistakes

- Using an outdated browser and seeing blank screens or broken layouts.
- Blocking cookies and being logged out immediately after sign-in.
- Uploading very large files on unstable mobile networks without retry logic.

## Troubleshooting

| Symptom | Try this |
|---------|----------|
| Page won't load | Confirm URL, VPN, and firewall rules. |
| Login loops | Enable cookies; clear site data and retry. |
| Uploads fail silently | Check connection speed and file size limits. See [Upload Problems](/docs/troubleshooting/upload-problems). |
| SSO errors | Contact your Company Admin—identity provider config is org-level. |

## Related Articles

- [Creating Your Account](/docs/getting-started/creating-account)
- [Logging In](/docs/getting-started/logging-in)
- [Common Issues](/docs/troubleshooting/common-issues)
- [Login Problems](/docs/troubleshooting/login-problems)

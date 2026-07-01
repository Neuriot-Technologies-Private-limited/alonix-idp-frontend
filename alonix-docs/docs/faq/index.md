---
title: Frequently Asked Questions
description: Answers to common questions about Alonix accounts, workspaces, documents, AI Chat, and administration.
sidebar_position: 1
---

# Frequently Asked Questions

## Overview

Quick answers to the questions Alonix users ask most often. For step-by-step guides, follow the linked articles in each answer.

## Purpose

Help you find authoritative answers without contacting support for routine topics.

## Prerequisites

None—browse by topic below.

---

## Account and Access

### What is Alonix?

Alonix is an Intelligent Document Platform (IDP) for storing, processing, searching, and chatting with your organization's documents. See [What Is Alonix?](/docs/introduction/what-is-alonix).

### How do I create an account?

Sign up at your organization's Alonix URL or accept an email invitation. Full steps: [Creating Your Account](/docs/getting-started/creating-account).

### I didn't receive my verification or invite email. What should I do?

Check spam/junk folders, confirm the email address, and ask your admin to resend. Wait five minutes before retrying. See [Login Problems](/docs/troubleshooting/login-problems).

### What is the difference between Company Admin, Group Admin, and Search User?

- **Company Admin** — entire organization, org settings, billing (SaaS).
- **Group Admin** — specific workspace(s): users, connectors, documents.
- **Search User** — search, AI Chat, reports within assigned workspaces.

Details: [Users and Roles](/docs/user-guide/users-and-roles).

### Why can't I see Billing or Org Settings?

Those sections are **Company Admin** only and appear on **SaaS** deployments. Self-hosted installs may manage licensing externally.

---

## Workspaces (Groups)

### What is a workspace? Is it the same as a Group?

Yes. **Groups** in the product are **workspaces** in the UI—they are the same thing. Each workspace isolates documents, users, and connectors. See [Workspaces](/docs/user-guide/workspaces).

### How do I switch workspaces?

Use the **workspace switcher** in the top navigation bar. [Workspace Switcher](/docs/user-guide/workspace-switcher).

### Why is my Documents list empty?

You may be in the wrong workspace, have no uploads yet, or documents are still processing. Confirm switcher and pipeline status.

### Can I move a document to another workspace?

There is typically no drag-and-drop move between workspaces. Re-upload or use connector rules per org policy. Ask your Group Admin.

---

## Documents and Pipeline

### Which file types can I upload?

Common formats include PDF, Word (DOCX), and standard images. Unsupported or corrupt files fail at pipeline stage. [Upload Problems](/docs/troubleshooting/upload-problems).

### How long does processing take?

Text PDFs often complete in minutes. Large scans requiring OCR may take longer. Watch status in [Documents](/docs/user-guide/documents) or [Dashboard](/docs/user-guide/dashboard).

### What do pipeline statuses mean?

Upload → Ingest → Extract → Classify → Ready. Failed means manual fix or re-upload. [Document Pipeline](/docs/user-guide/document-pipeline).

### Why can't I find a document in search?

Pipeline may be incomplete, workspace wrong, or keyword not in extracted text. See [Common Issues](/docs/troubleshooting/common-issues).

---

## AI Chat

### How does AI Chat know the answers?

Alonix retrieves relevant passages from your workspace documents and generates an answer with **citations** (RAG). It does not browse the public internet.

### Why didn't AI Chat cite any documents?

No matching processed documents exist, question too vague, or wrong workspace. [AI Chat Problems](/docs/troubleshooting/ai-chat-problems).

### Can I trust AI Chat for legal or financial decisions?

Use AI Chat as a research assistant—always **verify citations** in source documents before acting. [Security and Sensitivity](/docs/best-practices/security-sensitivity).

### Does AI Chat search all my workspaces at once?

No. Only the **currently selected workspace**.

---

## Connectors and Automation

### What connectors does Alonix support?

**Email**, **SFTP**, and **SharePoint**. [Connectors](/docs/user-guide/connectors).

### Who can set up connectors?

Typically **Group Admin** or **Company Admin**.

### My connector stopped working. What should I check?

Review [Activity Logs](/docs/user-guide/activity-logs) for auth failures; rotate expired credentials; confirm source folder or mailbox still exists.

---

## Reports and Compliance

### What export formats are available?

**CSV**, **PDF**, and **XLSX** depending on report type. [Reports](/docs/user-guide/reports).

### Who can see activity logs?

Usually admins; Search Users may see limited personal activity. [Activity Logs](/docs/user-guide/activity-logs).

---

## Billing (SaaS)

### Where do I update our payment card?

**Billing** section as Company Admin. [Billing](/docs/user-guide/billing).

### We hit our user or storage limit. What now?

Upgrade plan or remove inactive users—contact Company Admin or Alonix support for enterprise contracts.

---

## Getting Help

### Where should I start troubleshooting?

[Common Issues](/docs/troubleshooting/common-issues) → specialized guides for [login](/docs/troubleshooting/login-problems), [upload](/docs/troubleshooting/upload-problems), and [AI Chat](/docs/troubleshooting/ai-chat-problems).

### Is there developer or API documentation?

Yes. See [Developer Setup](/docs/developer/setup) and the Developer Reference section for API guides.

### Where are terms like "ingest" and "RAG" defined?

[Glossary](/docs/glossary/terms).

---

## Expected Results

You found an answer or a link to the right detailed guide.

## Tips

Bookmark this page and the [Glossary](/docs/glossary/terms) during onboarding.

## Best Practices

Search this FAQ before opening tickets—include workspace name and screenshots when you do escalate.

## Common Mistakes

Asking AI Chat about documents in a workspace you have not selected.

## Troubleshooting

Still stuck? Contact your **Group Admin** with: account email, workspace name, time of issue (with timezone), and screenshots (no passwords).

## Related Articles

- [What Is Alonix?](/docs/introduction/what-is-alonix)
- [Getting Started](/docs/getting-started/system-requirements)
- [User Guide](/docs/user-guide/dashboard)
- [Glossary](/docs/glossary/terms)

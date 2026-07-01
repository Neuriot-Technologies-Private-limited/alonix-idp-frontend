---
title: Connectors
description: Automate document intake into {{brandName}} using Email, SFTP, and SharePoint connectors.
sidebar_position: 7
---

# Connectors

## Overview

**Connectors** automatically bring documents into a workspace from external systems. {{brandName}} supports **Email**, **SFTP**, and **SharePoint** connectors so files arrive without manual upload.

## Purpose

Reduce manual work, shorten ingestion lag, and keep the document vault synchronized with systems your team already uses.

## Prerequisites

- **Group Admin** or **Company Admin** role to configure connectors
- Valid credentials and network access for the source system
- Target workspace selected — [Workspaces](/docs/user-guide/workspaces)

## Step-by-Step Instructions

### 1. Open Connectors

1. Select the workspace that should receive files.
2. Click **Connectors** in the sidebar.
3. View existing connectors or click **Add connector**.

[Screenshot – Connectors list showing Email, SFTP, and SharePoint options]

### 2. Configure Email connector

1. Choose **Email**.
2. Note the dedicated inbox address {{brandName}} provides (or configure forwarding rules).
3. Set filters: allowed senders, subject patterns, attachment types.
4. Save and send a test email with a sample attachment.
5. Confirm the document appears in **Documents** after pipeline processing.

### 3. Configure SFTP connector

1. Choose **SFTP**.
2. Enter host, port, username, and authentication (password or key).
3. Specify remote folder path and sync schedule.
4. Test connection and run initial sync.
5. Monitor [Activity Logs](/docs/user-guide/activity-logs) for sync results.

### 4. Configure SharePoint connector

1. Choose **SharePoint**.
2. Complete Microsoft authorization (OAuth) as prompted.
3. Select site, library, or folder to sync.
4. Set sync frequency and file filters.
5. Save and verify documents ingest into the workspace vault.

### 5. Monitor and maintain

- Review connector status on Dashboard and Activity Logs.
- Rotate credentials before expiry.
- Disable connectors during maintenance windows to avoid partial syncs.

## Expected Results

- New files from connected sources appear in Documents automatically.
- Pipeline runs ingest → extract → classify on connector files same as manual uploads.
- Failed syncs logged with actionable errors.

## Tips

:::warning Test in a pilot workspace
Validate connector rules with non-production data before pointing at live SharePoint libraries or mailboxes.
:::

- Email connectors work well for invoice inboxes and shared aliases.
- SFTP suits batch drops from partners or legacy systems.

## Best Practices

- Document connector ownership (who rotates passwords, who monitors failures).
- Align folder and mailbox rules with [Document Organization](/docs/best-practices/document-organization).
- Restrict connector destinations to one workspace per business function.

## Common Mistakes

- Pointing multiple connectors at the same workspace without deduplication strategy.
- Using personal SharePoint accounts instead of service principals (against IT policy).
- Forgetting connector files still respect workspace permissions—users only see results if they have workspace access.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Test email not ingested | Check spam filters, attachment type, sender allowlist. |
| SFTP auth failed | Verify key format, IP allowlist, and path. |
| SharePoint token expired | Re-authorize connector in admin UI. |
| Duplicates | Adjust sync rules; dedupe in source folder. |

## Related Articles

- [Connector Ingest Tutorial](/docs/tutorials/connector-ingest)
- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Documents](/docs/user-guide/documents)
- [Activity Logs](/docs/user-guide/activity-logs)

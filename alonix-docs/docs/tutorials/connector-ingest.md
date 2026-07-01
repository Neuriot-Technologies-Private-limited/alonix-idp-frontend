---
title: Ingest via Connector
description: Tutorial for setting up and testing an Email, SFTP, or SharePoint connector in Alonix.
sidebar_position: 6
---

# Tutorial: Ingest via Connector

## Overview

Automate document intake by configuring one connector type in a pilot workspace. This tutorial uses **Email** as the example; SFTP and SharePoint follow similar patterns.

## Purpose

Prove connector flow before production cutover.

## Prerequisites

- Group Admin or Company Admin
- Pilot workspace with no production-sensitive data
- Access to a test mailbox or SharePoint library / SFTP folder

## Step-by-Step Instructions

### Step 1: Choose connector type

| Source | Best for |
|--------|----------|
| Email | Invoices, shared inboxes |
| SFTP | Partner batch drops |
| SharePoint | Existing team libraries |

### Step 2: Add Email connector

1. Open **Connectors** in pilot workspace.
2. Click **Add connector** → **Email**.
3. Copy the Alonix ingestion address.
4. Set allowed senders to your test address only.
5. Save.

[Screenshot – Email connector configuration with ingestion address]

### Step 3: Send test message

1. From allowed sender, email a PDF attachment to the ingestion address.
2. Use subject line `Connector Test – [today's date]`.

### Step 4: Verify ingest

1. Wait 2–5 minutes.
2. Open **Documents**—file should appear.
3. Check [Activity Logs](/docs/user-guide/activity-logs) for connector event.

### Step 5: Confirm pipeline

Ensure document reaches **Complete** status—same as manual upload.

### Step 6: Document for production

Record: connector type, mailbox/path, owner, rotation schedule.

For SFTP/SharePoint, repeat Steps 2–5 using those wizards and IT credentials.

## Expected Results

Test file ingested automatically and searchable after pipeline.

## Tips

:::warning Pilot first
Never point production SharePoint libraries at an untested connector config.
:::

## Best Practices

[Connectors](/docs/user-guide/connectors) reference for all three types.

## Common Mistakes

Omitting sender allowlist on Email—unexpected mail ingested.

## Troubleshooting

No file after 10 minutes—check Activity Logs error; verify attachment type.

## Related Articles

- [Connectors](/docs/user-guide/connectors)
- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Activity Logs](/docs/user-guide/activity-logs)

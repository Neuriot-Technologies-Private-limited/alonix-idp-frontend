---
title: Dashboard Overview
description: Understand the Alonix Dashboard—widgets, metrics, and quick actions for your active workspace.
sidebar_position: 5
---

# Dashboard Overview

## Overview

The Dashboard is your home screen in Alonix. It summarizes recent activity, document pipeline status, and shortcuts to common tasks for the **currently selected workspace**.

## Purpose

Give you an at-a-glance view of what is happening in your workspace so you can prioritize uploads, reviews, AI Chat, and reports.

## Prerequisites

- Logged in to Alonix
- An active workspace selected in the [workspace switcher](/docs/user-guide/workspace-switcher)

## Step-by-Step Instructions

### 1. Open the Dashboard

1. Log in to Alonix.
2. Click **Dashboard** in the sidebar, or the logo in the top navigation.
3. Confirm the correct workspace name appears in the top bar.

[Screenshot – Dashboard with summary cards and recent activity list]

### 2. Review summary widgets

Dashboard widgets may include (depending on role and configuration):

| Widget | What it shows |
|--------|----------------|
| **Document count** | Total documents in the workspace |
| **Pipeline status** | Files processing, completed, or failed |
| **Recent uploads** | Latest documents added |
| **AI Chat activity** | Recent questions or popular topics |
| **User activity** | Logins, invites, connector runs (admins) |
| **Storage usage** | Space consumed (if enabled) |

### 3. Use quick actions

Look for action buttons or links such as:

- **Upload document** — jump to Documents with upload dialog
- **Open AI Chat** — start a new conversation
- **View reports** — open Reports section
- **Manage users** — Group Admin shortcut to Users

### 4. Drill into details

Click any widget row or **View all** link to open the full list in Documents, Activity Logs, or Reports.

### 5. Switch workspaces to compare

Change the workspace in the top navigation switcher. The Dashboard refreshes to show data for the newly selected Group only—data does not mix across workspaces.

## Expected Results

- You see accurate counts and recent items for the active workspace.
- Quick actions take you to the correct section with the workspace context preserved.
- Admins see additional operational metrics not visible to Search Users.

## Tips

:::tip Make the Dashboard your morning check
A 30-second Dashboard review catches failed pipeline jobs before users notice search gaps.
:::

- Failed pipeline items often appear in Dashboard summaries before users search for missing content.
- Group Admins should scan connector and upload activity daily during rollout.

## Best Practices

- Investigate failed pipeline statuses promptly—see [Document Pipeline](/docs/user-guide/document-pipeline).
- Use Dashboard trends to schedule report exports for stakeholders.
- Do not use Dashboard as a document repository—open [Documents](/docs/user-guide/documents) for full search and filters.

## Common Mistakes

- Reading Dashboard numbers while the wrong workspace is selected.
- Ignoring "processing" counts and assuming uploads are immediately searchable.
- Expecting cross-workspace analytics on the Dashboard—it is per-workspace by design.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Dashboard empty | New workspace—upload documents or wait for connector sync. |
| Numbers seem stale | Refresh the page; pipeline may still be running. |
| Missing widgets | Role or plan may limit visibility; contact Company Admin. |
| Quick action fails | Confirm permissions in [Users and Roles](/docs/user-guide/users-and-roles). |

## Related Articles

- [Dashboard (User Guide)](/docs/user-guide/dashboard)
- [Your First Document](/docs/getting-started/your-first-document)
- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Activity Logs](/docs/user-guide/activity-logs)

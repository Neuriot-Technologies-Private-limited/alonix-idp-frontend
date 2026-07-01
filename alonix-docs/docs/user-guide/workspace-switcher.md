---
title: Workspace Switcher
description: Switch between {{brandName}} workspaces (Groups) using the top navigation workspace switcher.
sidebar_position: 3
---

# Workspace Switcher

## Overview

The **workspace switcher** in the top navigation bar lets you change which Group (workspace) you are working in. All documents, AI Chat sessions, and reports respect the currently selected workspace.

## Purpose

Ensure you always operate in the correct team context and understand how switching affects what you see.

## Prerequisites

- Membership in at least one workspace
- Logged in to {{brandName}}

## Step-by-Step Instructions

### 1. Locate the switcher

Look at the **top navigation bar**. The switcher displays the **current workspace name**, often with a dropdown chevron.

[Screenshot – Workspace switcher dropdown open showing multiple Groups]

### 2. Open the dropdown

1. Click the workspace name or chevron.
2. A list of workspaces you can access appears.
3. Names and optional descriptions help you choose the right Group.

### 3. Select a workspace

1. Click the desired workspace.
2. The page reloads or refreshes context.
3. Sidebar, Dashboard, and Documents now show data for that workspace only.

### 4. Confirm your selection

Before uploading or using AI Chat:

- Glance at the switcher label.
- Verify it matches your intended team or project.

### 5. Single-workspace users

If you belong to only one workspace, the switcher may show a single entry with no meaningful change—but it still indicates your active context.

## Expected Results

- UI data updates to match the selected workspace.
- Uploads and chat citations pull from documents in that workspace only.
- No cross-workspace data leakage in search or reports.

## Tips

:::warning Always check before bulk upload
Bulk uploads to the wrong workspace are painful to fix. Confirm the switcher first.
:::

Bookmarking a URL may not preserve workspace context across sessions—re-select after login if needed.

## Best Practices

- Train teams to call out workspace name in meetings ("switch to Legal Contracts before we upload").
- Group Admins naming workspaces clearly reduces switcher mistakes.
- Sign out on shared machines after working in sensitive workspaces.

## Common Mistakes

- Assuming the last workspace persists on a new device—it usually does, but verify after login.
- Running reports in workspace A while stakeholders expect workspace B data.
- Inviting users to the wrong workspace—fix in [Users](/docs/user-guide/users-and-roles).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Missing workspace in list | Accept pending invite or ask admin for access. |
| Switcher does not change data | Hard refresh browser; log out and in. |
| See workspace but empty Documents | Correct workspace may have no files yet. |

## Related Articles

- [Workspaces](/docs/user-guide/workspaces)
- [UI Overview](/docs/getting-started/ui-overview)
- [Documents](/docs/user-guide/documents)
- [Workspace Governance](/docs/best-practices/workspace-governance)

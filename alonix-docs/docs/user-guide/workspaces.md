---
title: Workspaces
description: Create, manage, and organize {{brandName}} workspaces (Groups) for teams and projects.
sidebar_position: 2
---

# Workspaces

## Overview

**Workspaces** in the {{brandName}} UI are called **Groups** in the platform. Each workspace is a secure container for documents, users, connectors, and settings. Organizations typically run multiple workspaces for different departments or projects.

## Purpose

Help admins structure teams and help all users understand how workspace boundaries affect documents, search, and permissions.

## Prerequisites

- **Company Admin** or **Group Admin** to create or edit workspaces
- **Search User** can view and work inside assigned workspaces only

## Step-by-Step Instructions

### 1. View all workspaces

1. Open **Groups** or **Workspaces** in the sidebar (admin views).
2. Browse the list of workspaces in your organization.
3. Click a workspace name to open details or switch context.

[Screenshot – Workspaces list with name, member count, and created date]

### 2. Create a workspace

1. Click **Create workspace**.
2. Enter **Name** and **Description**.
3. Save. The workspace appears in the [workspace switcher](/docs/user-guide/workspace-switcher).

### 3. Edit workspace settings

Group Admins and Company Admins can update:

- Display name and description
- Default document options (where configured)
- Member list via [Users](/docs/user-guide/users-and-roles)

### 4. Archive or delete (if enabled)

Some deployments allow archiving inactive workspaces. Confirm with your Company Admin before removing workspaces with legal retention requirements.

### 5. Work inside a workspace

1. Select the workspace in the top navigation switcher.
2. All subsequent actions—uploads, chat, reports—apply only to that workspace.

## Expected Results

- Clear separation of documents and users per workspace.
- Admins can provision new teams without affecting other Groups.
- Users see only workspaces they belong to.

## Tips

:::note Groups = Workspaces
Documentation and UI labels may say "Group" or "Workspace"—they mean the same thing in {{brandName}}.
:::

Plan workspace count before bulk connector setup—each connector instance is usually workspace-scoped.

## Best Practices

- Follow [Workspace Governance](/docs/best-practices/workspace-governance) for naming and lifecycle rules.
- Limit sensitive data to dedicated workspaces with tighter membership.
- Assign at least two Group Admins per production workspace.

## Common Mistakes

- Duplicating workspaces for the same function.
- Configuring connectors in workspace A while users upload manually to workspace B.
- Deleting workspaces without exporting required [Reports](/docs/user-guide/reports).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot see workspace | Request invite from Group Admin. |
| Cannot create workspace | Role insufficient—contact Company Admin. |
| Data in wrong workspace | Move/re-upload per org policy; switch switcher going forward. |

## Related Articles

- [Workspace Switcher](/docs/user-guide/workspace-switcher)
- [Your First Workspace](/docs/getting-started/your-first-workspace)
- [First Workspace Tutorial](/docs/tutorials/first-workspace)
- [Users and Roles](/docs/user-guide/users-and-roles)

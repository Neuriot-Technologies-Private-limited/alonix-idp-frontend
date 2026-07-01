---
title: Users and Roles
description: Manage users, invitations, and roles—Company Admin, Group Admin, and Search User—in Alonix.
sidebar_position: 8
---

# Users and Roles

## Overview

Alonix uses **role-based access control** at the organization and workspace level. Admins invite users, assign roles, and control who can manage settings versus who can search and chat.

## Purpose

Ensure the right people have the right permissions—balancing productivity with security and audit requirements.

## Prerequisites

- **Company Admin** for org-wide user management and role assignment
- **Group Admin** for workspace-level invites (depending on configuration)

## Step-by-Step Instructions

### 1. Understand the three roles

| Role | Scope | Typical permissions |
|------|-------|---------------------|
| **Company Admin** | Entire organization | All workspaces, org settings, billing (SaaS), global user admin |
| **Group Admin** | Assigned workspace(s) | Invite users to workspace, manage documents, connectors, workspace settings |
| **Search User** | Assigned workspace(s) | Search documents, AI Chat, download reports, view own activity |

[Screenshot – Users table showing name, email, role, and workspace assignments]

### 2. View users

1. Click **Users** in the sidebar (admin).
2. Browse organization or workspace member lists.
3. Filter by role or workspace as needed.

### 3. Invite a user to a workspace

1. Click **Invite user**.
2. Enter email address.
3. Select **role** (Group Admin or Search User for workspace invites).
4. Select target **workspace(s)**.
5. Send invitation.

The invitee receives email with an **Accept invitation** link — see [Invite Team Tutorial](/docs/tutorials/invite-team).

### 4. Change roles or remove access

1. Locate the user in the Users list.
2. Click **Edit** or the role dropdown.
3. Update role or workspace membership.
4. Save. Changes take effect on next login or immediately per deployment.

### 5. Company Admin responsibilities

- Promote/demote Company Admins cautiously.
- Offboard users promptly when they leave the organization.
- Review [Org Settings](/docs/user-guide/org-settings) and [Activity Logs](/docs/user-guide/activity-logs) periodically.

## Expected Results

- Users receive invitation emails and can access assigned workspaces.
- Role changes reflect in UI visibility (menus, buttons).
- Removed users cannot log in or access workspace data.

## Tips

:::tip Least privilege
Default new users to **Search User** unless they need admin capabilities.
:::

- Company Admins can access all workspaces; avoid using that role for daily document work.
- Group Admins cannot manage billing—Company Admin only on SaaS.

## Best Practices

- Maintain an access review calendar (quarterly role audits).
- Use corporate email domains for invites.
- Pair role changes with [Activity Logs](/docs/user-guide/activity-logs) review for sensitive workspaces.

## Common Mistakes

- Granting Company Admin to every team lead.
- Leaving departed employees active "until we get around to it."
- Inviting users to the wrong workspace—double-check before send.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Invite not received | Check spam; resend; verify email spelling. |
| User sees no menus | Role is Search User—expected for admin sections. |
| Cannot change role | Insufficient admin level—escalate to Company Admin. |

## Related Articles

- [Manage Users Tutorial](/docs/tutorials/manage-users)
- [Invite Team Tutorial](/docs/tutorials/invite-team)
- [Org Settings](/docs/user-guide/org-settings)
- [Workspace Governance](/docs/best-practices/workspace-governance)

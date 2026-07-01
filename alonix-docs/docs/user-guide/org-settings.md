---
title: Org Settings
description: Configure organization-wide Alonix settings as a Company Admin.
sidebar_position: 12
---

# Org Settings

## Overview

**Org Settings** control organization-wide configuration—branding, security policies, default behaviors, and integrations that apply across all workspaces. Only **Company Admins** typically access this section.

## Purpose

Centralize governance so every workspace inherits consistent security and operational rules.

## Prerequisites

- **Company Admin** role
- Understanding of your organization's IT and compliance policies

## Step-by-Step Instructions

### 1. Open Org Settings

1. Log in as Company Admin.
2. Click **Org Settings** in the sidebar or profile menu.

[Screenshot – Org settings page with security and general configuration sections]

### 2. Review general settings

Common options:

- Organization display name
- Default locale or time zone
- Support contact information
- Feature toggles (per plan)

### 3. Configure security policies

May include:

- Password complexity requirements
- Session timeout duration
- IP allowlisting (if enabled)
- Email domain restrictions for signup

Coordinate with IT before enabling restrictive policies.

### 4. Manage workspace defaults

Set defaults new workspaces inherit:

- Document retention hints
- Classification defaults
- Connector approval workflows (if applicable)

### 5. Save and communicate changes

1. Save each section after edits.
2. Notify Group Admins of policy changes affecting their teams.
3. Monitor [Activity Logs](/docs/user-guide/activity-logs) for issues after rollout.

## Expected Results

- Organization-wide settings apply to all users and workspaces.
- Security policies enforced at login and during sensitive actions.
- Audit trail of admin changes in activity logs.

## Tips

:::warning Test policy changes in staging
If your company runs a staging Alonix environment, validate session timeout and domain rules there first.
:::

- Document org settings in internal runbooks for continuity when admins change roles.
- Pair org security settings with [Security and Sensitivity](/docs/best-practices/security-sensitivity) guidance for teams.

## Best Practices

- Limit Company Admin count to trusted personnel.
- Review org settings quarterly alongside access reviews.
- Align retention and export rules with legal counsel.

## Common Mistakes

- Locking out all users with overly aggressive IP allowlists.
- Changing session timeout without warning remote workers.
- Duplicating workspace-specific rules at org level causing confusion.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot see Org Settings | You are not Company Admin. |
| Setting not saving | Validation error—read inline messages. |
| Users locked out | Revert policy; use break-glass admin account per runbook. |

## Related Articles

- [Users and Roles](/docs/user-guide/users-and-roles)
- [Billing](/docs/user-guide/billing) (SaaS)
- [Workspace Governance](/docs/best-practices/workspace-governance)
- [Activity Logs](/docs/user-guide/activity-logs)

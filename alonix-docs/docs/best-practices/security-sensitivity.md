---
title: Security and Sensitivity
description: Best practices for handling sensitive documents and access control in {{brandName}}.
sidebar_position: 2
---

# Security and Sensitivity

## Overview

{{brandName}} centralizes valuable information—which raises the stakes for access control, export discipline, and AI Chat usage. This guide helps teams handle sensitive data responsibly.

## Purpose

Reduce risk of unauthorized access, leaky exports, and over-trust in AI-generated summaries.

## Prerequisites

- Understanding of your organization's data classification policy (Public, Internal, Confidential, Restricted)
- Company Admin or Group Admin involvement for workspace boundaries

## Step-by-Step Instructions

### 1. Map data classes to workspaces

| Classification | Workspace approach |
|----------------|-------------------|
| Public / Internal | Shared team workspace |
| Confidential | Department workspace, limited Group Admins |
| Restricted | Dedicated workspace, minimal membership, no casual AI experiments |

### 2. Apply least-privilege roles

- Default **Search User** for most staff.
- **Group Admin** only for trusted leads.
- **Company Admin** limited to IT/compliance owners.

### 3. Control exports

- Reports to encrypted storage or secure file shares only.
- No personal email for Confidential+ exports.
- Log review after bulk [Reports](/docs/user-guide/reports) generation.

### 4. Use AI Chat safely

- Verify **citations** before acting on answers.
- Do not paste secrets (passwords, API keys) into chat.
- Assume chat queries may be logged—follow internal policy.

### 5. Connector credentials

- Service accounts with minimum SharePoint/SFTP scope.
- Rotate passwords on schedule.
- Monitor [Activity Logs](/docs/user-guide/activity-logs) for failed auth spikes.

### 6. Offboard promptly

Remove access same day as HR offboarding—[Manage Users](/docs/tutorials/manage-users).

## Expected Results

- Sensitive data isolated to appropriate workspaces.
- Audit trail via activity logs and controlled exports.
- AI used as assistive search, not unverified authority.

## Tips

:::warning When in doubt, segregate
A separate workspace with fewer users is cheaper than a data incident.
:::

## Best Practices

- Annual training on phishing and credential theft.
- Align [Org Settings](/docs/user-guide/org-settings) session timeout with policy.
- Legal review before ingesting attorney-client privileged material.

## Common Mistakes

- Company-wide workspace for all HR medical records.
- Downloading Restricted files to unmanaged laptops.
- Skipping citation verification in compliance workflows.

## Troubleshooting

Suspected unauthorized access—freeze account, pull Activity Logs, contact Company Admin and security team per incident runbook.

## Related Articles

- [Users and Roles](/docs/user-guide/users-and-roles)
- [Workspace Governance](/docs/best-practices/workspace-governance)
- [Activity Logs](/docs/user-guide/activity-logs)
- [AI Chat](/docs/user-guide/ai-chat)

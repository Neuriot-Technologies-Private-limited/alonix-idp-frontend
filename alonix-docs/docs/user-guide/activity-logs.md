---
title: Activity Logs
description: Review user and system activity in {{brandName}} for auditing, compliance, and troubleshooting.
sidebar_position: 10
---

# Activity Logs

## Overview

**Activity Logs** record who did what and when across your organization or workspace—logins, uploads, invites, connector runs, exports, and setting changes.

## Purpose

Support security audits, incident investigation, and operational transparency without guessing from informal channels.

## Prerequisites

- **Company Admin** or **Group Admin** for full logs (typical)
- **Search User** may see limited personal activity depending on configuration
- Appropriate workspace or org context selected

## Step-by-Step Instructions

### 1. Open Activity Logs

1. Click **Activity Logs** in the sidebar.
2. Choose org-wide or workspace-scoped view if prompted.

[Screenshot – Activity log table with timestamp, user, action, and resource columns]

### 2. Filter events

Use filters such as:

- **Date range**
- **User**
- **Action type** (login, upload, delete, invite, export, connector sync)
- **Workspace** (Company Admin)

### 3. Investigate an event

1. Click a row for detail (IP address, resource ID, error message if failed).
2. Cross-reference with [Documents](/docs/user-guide/documents) or [Users](/docs/user-guide/users-and-roles).

### 4. Export logs (if available)

Some deployments allow exporting log segments as CSV, PDF, or Excel for compliance archives. Follow your org retention policy.

### 5. Regular review cadence

Group Admins: weekly during rollout, monthly steady state.  
Company Admins: review privileged actions and failed connector auth.

## Expected Results

- Chronological, searchable record of platform events.
- Enough detail to attribute actions to individual users.
- Failed operations visible with error context.

## Tips

- Correlate spike in failed logins with [Login Problems](/docs/troubleshooting/login-problems).
- Use logs to verify offboarding—confirm no activity after user removal.

## Best Practices

- Define retention requirements with legal/compliance before purging exports.
- Restrict log export permissions to admins.
- Document expected connector sync times to avoid false alarms.

## Common Mistakes

- Assuming deleted documents leave no trace—deletion is typically logged.
- Ignoring failed connector events until documents are missing.
- Sharing raw log exports externally without redaction.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot see logs | Role restriction—request admin access. |
| Missing expected event | Clock skew rare; verify filters and workspace scope. |
| Too many events | Narrow date range and action type filters. |

## Related Articles

- [Users and Roles](/docs/user-guide/users-and-roles)
- [Connectors](/docs/user-guide/connectors)
- [Reports](/docs/user-guide/reports)
- [Workspace Governance](/docs/best-practices/workspace-governance)

---
title: Dashboard
description: Use the {{brandName}} Dashboard to monitor workspace activity, pipeline health, and quick actions.
sidebar_position: 1
---

# Dashboard

## Overview

The Dashboard is the operational home for your active workspace. It aggregates document counts, pipeline status, recent activity, and shortcuts so admins and everyday users can spot issues and jump to tasks quickly.

## Purpose

Provide a single screen to monitor workspace health and access frequent actions without navigating multiple sections.

## Prerequisites

- {{brandName}} account with workspace access
- Correct workspace selected — [Workspace Switcher](/docs/user-guide/workspace-switcher)

## Step-by-Step Instructions

### 1. Navigate to Dashboard

Click **Dashboard** in the sidebar or the {{brandName}} logo in the top navigation.

### 2. Interpret key metrics

| Metric | Meaning |
|--------|---------|
| Total documents | Files in this workspace vault |
| Processing | Documents still in the pipeline |
| Failed | Documents needing admin attention |
| Recent activity | Uploads, logins, connector runs |

[Screenshot – Dashboard metric cards and activity feed]

### 3. Act on pipeline failures

1. Locate failed items in the pipeline widget or activity feed.
2. Click through to the document detail.
3. Review the error message.
4. Re-upload or fix source file as needed.

### 4. Use quick actions

Common shortcuts from the Dashboard:

- Upload document
- Open AI Chat
- Generate report
- Manage users (admins)

### 5. Refresh for latest data

Reload the page or navigate away and back if you expect new connector or upload activity.

## Expected Results

Accurate, workspace-scoped metrics and working links to Documents, Reports, and admin tools appropriate for your role.

## Tips

Group Admins should review failed pipeline counts daily during active ingestion periods.

## Best Practices

- Pair Dashboard checks with [Activity Logs](/docs/user-guide/activity-logs) for audit investigations.
- Do not treat Dashboard as authoritative for compliance exports—use [Reports](/docs/user-guide/reports).

## Common Mistakes

- Comparing metrics across workspaces without switching context.
- Ignoring small failed counts that block search coverage.

## Troubleshooting

See [Dashboard Overview](/docs/getting-started/dashboard-overview) and [Common Issues](/docs/troubleshooting/common-issues).

## Related Articles

- [Dashboard Overview](/docs/getting-started/dashboard-overview)
- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Activity Logs](/docs/user-guide/activity-logs)
- [Reports](/docs/user-guide/reports)

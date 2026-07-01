---
title: Common Issues
description: Quick fixes for the most frequent {{brandName}} problems end users encounter.
sidebar_position: 1
---

# Common Issues

## Overview

This page collects high-frequency issues and first-line fixes. Use it before opening a support ticket or paging your admin.

## Purpose

Resolve typical problems quickly with structured checks.

## Prerequisites

- {{brandName}} login (where applicable)
- Knowledge of your role and workspace name

## Step-by-Step Instructions

### Issue: Cannot find a document

1. Check [workspace switcher](/docs/user-guide/workspace-switcher)—correct Group?
2. Open **Documents** → search exact keyword from file.
3. Filter status **Complete**—still processing?
4. If connector-sourced, wait for sync—check [Activity Logs](/docs/user-guide/activity-logs).

### Issue: Feature or menu missing

1. Compare with [Users and Roles](/docs/user-guide/users-and-roles)—Search User vs Admin.
2. SaaS-only features (Billing) require Company Admin.
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R).

### Issue: Slow performance

1. Check network stability.
2. Large PDF preview—try download instead.
3. Peak hours—retry AI Chat or report generation.

### Issue: Unexpected logout

1. Session timeout from [Org Settings](/docs/user-guide/org-settings).
2. Password changed on another device.
3. Clear cookies only for {{brandName}} domain and log in again.

### Issue: Email invite or verification problems

1. Spam/junk folder.
2. Correct email spelling.
3. Resend from admin or login page.

[Screenshot – Browser refresh and workspace switcher check annotated]

## Expected Results

Most issues resolve without admin intervention after workspace, role, and pipeline checks.

## Tips

Keep a personal checklist: **Workspace → Role → Pipeline status → Browser**.

## Best Practices

Document recurring org-specific issues in your internal wiki linking to these guides.

## Common Mistakes

Assuming platform outage before checking wrong workspace.

## Troubleshooting

If none of the above applies:

| Severity | Action |
|----------|--------|
| Blocks work | Contact Group Admin with screenshot, time (UTC), workspace name |
| Security concern | Contact Company Admin immediately |
| Data loss fear | Do not delete—check Activity Logs first |

## Related Articles

- [Login Problems](/docs/troubleshooting/login-problems)
- [Upload Problems](/docs/troubleshooting/upload-problems)
- [AI Chat Problems](/docs/troubleshooting/ai-chat-problems)
- [FAQ](/docs/faq/)

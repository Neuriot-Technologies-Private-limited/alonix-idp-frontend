---
title: Logging In
description: Sign in to {{brandName}}, reset your password, and resolve common access issues.
sidebar_position: 3
---

# Logging In

## Overview

{{brandName}} uses email and password authentication. After your account is created and verified, you sign in through your organization's {{brandName}} URL to access dashboards, workspaces, and documents.

## Purpose

Securely access your {{brandName}} account and start working in the correct workspace.

## Prerequisites

- A verified {{brandName}} account — see [Creating Your Account](/docs/getting-started/creating-account)
- Supported browser — see [System Requirements](/docs/getting-started/system-requirements)
- Your organization's {{brandName}} URL

## Step-by-Step Instructions

### 1. Go to the login page

1. Open your browser and navigate to your {{brandName}} URL.
2. The login screen displays **Email** and **Password** fields.

[Screenshot – {{brandName}} login form with email and password fields]

### 2. Enter credentials

1. Type the email address associated with your account.
2. Enter your password.
3. Click **Log in** or **Sign in**.

### 3. Select your workspace

After a successful login:

1. Check the **workspace switcher** in the top navigation.
2. If you belong to multiple Groups, select the workspace you want to work in.
3. The dashboard loads for the active workspace.

See [Workspace Switcher](/docs/user-guide/workspace-switcher) for details.

### 4. Stay signed in (optional)

If your organization allows it, you may see **Remember me**. Use this only on trusted personal devices—not shared or public computers.

### 5. Reset your password

If you forgot your password:

1. On the login page, click **Forgot password**.
2. Enter your registered email address.
3. Check your inbox for a reset link.
4. Click the link, enter a new password, and confirm.
5. Return to the login page and sign in with the new password.

:::warning Reset links expire
Use the link promptly. If it expires, request a new reset email.
:::

## Expected Results

- You are authenticated and see the main application shell (top nav, sidebar, content area).
- Your name or avatar appears in the profile area.
- The workspace switcher shows workspaces you have access to.
- Unauthorized areas (e.g., Org Settings for Search Users) are hidden or disabled.

## Tips

- Bookmark the login URL after your first successful sign-in.
- If you use multiple {{brandName}} environments (staging vs production), label bookmarks clearly.
- Sign out when finished on shared computers via **Profile → Log out**.

## Best Practices

- Never share passwords or reuse credentials from other systems.
- Report suspicious login emails to your Company Admin.
- Use [Profile Settings](/docs/user-guide/profile-settings) to keep your display name accurate for activity logs.

## Common Mistakes

- Typing the wrong email alias (`user@company.com` vs `user.name@company.com`).
- Caps Lock on when entering password.
- Resetting password but still using an old saved password in the browser autofill.

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| "Invalid credentials" | Verify email and password; use Forgot password. |
| Account locked | Wait for lockout period or contact Company Admin. |
| Email not verified | Complete verification from [Creating Your Account](/docs/getting-started/creating-account). |
| Blank page after login | Update browser; clear cache. See [Login Problems](/docs/troubleshooting/login-problems). |
| No workspaces listed | Ask Group Admin or Company Admin for an invitation. |

## Related Articles

- [Creating Your Account](/docs/getting-started/creating-account)
- [UI Overview](/docs/getting-started/ui-overview)
- [Workspace Switcher](/docs/user-guide/workspace-switcher)
- [Login Problems](/docs/troubleshooting/login-problems)

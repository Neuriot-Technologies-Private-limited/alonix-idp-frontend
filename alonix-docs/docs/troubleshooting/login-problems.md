---
title: Login Problems
description: Troubleshoot {{brandName}} sign-in, password reset, and session issues.
sidebar_position: 2
---

# Login Problems

## Overview

Login issues usually stem from credentials, unverified email, browser settings, or org security policies. This guide walks through systematic recovery.

## Purpose

Restore access quickly and safely without unnecessary password resets.

## Prerequisites

- Registered email address
- Access to email inbox for verification or reset links

## Step-by-Step Instructions

### 1. Verify basics

1. Correct {{brandName}} URL (bookmark from IT).
2. Correct email—no typos, correct domain.
3. Caps Lock off.
4. Try incognito/private window to bypass stale cache.

### 2. Reset password

1. Click **Forgot password** on login page.
2. Enter registered email.
3. Open reset link within validity window.
4. Set new password per policy.
5. Log in with new password—not old autofill entry.

[Screenshot – Forgot password flow]

### 3. Complete email verification

If message says email not verified:

1. Request new verification email.
2. Click link in inbox.
3. Retry login.

See [Creating Your Account](/docs/getting-started/creating-account).

### 4. Account lockout

After multiple failed attempts, accounts may lock temporarily.

- Wait for lockout period (often 15–30 minutes).
- Or contact Company Admin to unlock.

### 5. SSO / corporate identity (if enabled)

- Use **Sign in with SSO** button if shown.
- Corporate password changes may require SSO re-auth.
- VPN requirements—check with IT.

### 6. Browser and cookies

1. Enable cookies for {{brandName}} domain.
2. Disable blocking extensions temporarily.
3. Update browser—[System Requirements](/docs/getting-started/system-requirements).

## Expected Results

Successful login with workspace switcher visible and session stable for org timeout period.

## Tips

After password reset, update saved credentials in password manager.

## Best Practices

Report phishing emails impersonating {{brandName}} to security team.

## Common Mistakes

Resetting password but browser autofills old one.

## Troubleshooting

| Error message | Likely fix |
|---------------|------------|
| Invalid credentials | Reset password; verify email |
| Account disabled | Company Admin re-enable |
| Email not verified | Verification link |
| SSO error | IT identity provider config |

Still blocked? Provide admin: email, timestamp, browser, screenshot (no password).

## Related Articles

- [Logging In](/docs/getting-started/logging-in)
- [Profile Settings](/docs/user-guide/profile-settings)
- [Common Issues](/docs/troubleshooting/common-issues)
- [Org Settings](/docs/user-guide/org-settings)

---
title: Workspace Governance
description: Best practices for creating, managing, and retiring Alonix workspaces at scale.
sidebar_position: 3
---

# Workspace Governance

## Overview

As organizations adopt Alonix, workspace sprawl creates admin overhead and access risk. Governance defines when to create workspaces, who owns them, and how to retire them safely.

## Purpose

Provide a lightweight framework Company Admins and Group Admins can adopt without bureaucracy.

## Prerequisites

- Company Admin oversight
- Inventory of departments or projects needing isolation

## Step-by-Step Instructions

### 1. Set creation rules

Document when a **new workspace** is required vs when to use an existing one:

| Create new | Reuse existing |
|------------|----------------|
| Different data sensitivity | Same team, new project phase |
| Regulatory boundary | Temporary campaign in same dept |
| External partner collaboration | Small doc batch for same group |

### 2. Assign ownership

Each workspace needs:

- **Primary Group Admin** — day-to-day
- **Backup Group Admin** — vacation and departures
- **Executive sponsor** — escalations

### 3. Standardize naming

`{Department} – {Function}` or `{Project} – {Year}`

Avoid duplicate names across org—check list before create.

### 4. Onboarding checklist

For each new workspace:

- [ ] Name and description
- [ ] Two Group Admins
- [ ] Naming convention shared with uploaders
- [ ] Connector plan documented
- [ ] Test upload + AI Chat smoke test

### 5. Retirement checklist

Before archive/delete:

- [ ] Export required [Reports](/docs/user-guide/reports)
- [ ] Legal hold confirmation
- [ ] Remove all users
- [ ] Disable connectors
- [ ] Log completion in Activity Logs review

## Expected Results

- Predictable workspace count and ownership.
- Faster audits—every workspace has a named owner.
- Safer offboarding of inactive projects.

## Tips

Review workspace list quarterly with Company Admin.

## Best Practices

- [Document Organization](/docs/best-practices/document-organization) per workspace.
- [Security and Sensitivity](/docs/best-practices/security-sensitivity) mapping up front.
- Don't merge workspaces without migration plan—export and re-import may be required.

## Common Mistakes

- One workspace per employee instead of per team.
- No backup admin—workspace orphaned when lead leaves.
- Deleting workspace under legal hold.

## Troubleshooting

Orphan workspace—Company Admin reassigns Group Admin from Users page.

## Related Articles

- [Workspaces](/docs/user-guide/workspaces)
- [Users and Roles](/docs/user-guide/users-and-roles)
- [Org Settings](/docs/user-guide/org-settings)
- [First Workspace Tutorial](/docs/tutorials/first-workspace)

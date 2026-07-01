---
title: Upload Problems
description: Troubleshoot failed or stuck document uploads in Alonix.
sidebar_position: 3
---

# Upload Problems

## Overview

Upload failures can result from file size limits, unsupported formats, network drops, or workspace permission issues. This guide helps you diagnose and fix them.

## Purpose

Get documents into the vault reliably and understand when to escalate to admins.

## Prerequisites

- Upload permission in active workspace
- Original file available for retry

## Step-by-Step Instructions

### 1. Confirm workspace and permissions

1. Check [workspace switcher](/docs/user-guide/workspace-switcher).
2. Search Users can upload in most deployments—if upload button missing, ask Group Admin.

### 2. Check file suitability

| Check | Action |
|-------|--------|
| Format | Use PDF, DOCX, common images |
| Password protection | Remove PDF password; re-save |
| Corruption | Open locally—re-export if broken |
| Size | Split or compress per org limit |
| Empty file | Replace with valid content |

### 3. Retry upload

1. Stable network (wired/Wi‑Fi).
2. Single file first—not whole folder.
3. Watch for error toast or inline message.
4. Note exact error text for admin ticket.

[Screenshot – Upload error message example]

### 4. Pipeline vs upload failure

- **Upload fails immediately** — transfer issue or validation.
- **Upload succeeds, pipeline Failed** — see [Document Pipeline](/docs/user-guide/document-pipeline).

### 5. Browser troubleshooting

1. Disable ad blockers for Alonix domain.
2. Try another supported browser.
3. Clear site cache—not all browser data.

### 6. Connector alternative

If manual upload blocked by policy, ask Group Admin about [Connectors](/docs/user-guide/connectors).

## Expected Results

File uploads with progress completion and pipeline moves beyond Failed state.

## Tips

Rename files to ASCII characters if special symbols cause issues on older integrations.

## Best Practices

Batch large migrations during off-peak hours with admin monitoring Dashboard.

## Common Mistakes

Retrying same corrupt PDF ten times without fixing source.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Instant failure | Format/size/password |
| Stuck at 99% | Network blip—retry |
| Pipeline Failed | Re-export PDF; OCR quality |
| 403 / permission | Role or workspace |

## Related Articles

- [Documents](/docs/user-guide/documents)
- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Upload Document Tutorial](/docs/tutorials/upload-document)
- [Common Issues](/docs/troubleshooting/common-issues)

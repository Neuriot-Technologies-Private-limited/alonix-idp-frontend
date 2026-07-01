---
title: Document Organization
description: Best practices for naming, structuring, and maintaining documents in Alonix workspaces.
sidebar_position: 1
---

# Document Organization

## Overview

Good document organization in Alonix improves search, AI Chat accuracy, and report quality. This guide covers naming, batching uploads, and ongoing hygiene—without requiring a complex folder hierarchy inside the platform.

## Purpose

Help teams establish conventions early so the vault stays navigable as volume grows.

## Prerequisites

- Active workspace with upload permissions
- Agreement from team leads on naming standards

## Step-by-Step Instructions

### 1. Define a filename pattern

Example patterns:

| Type | Pattern |
|------|---------|
| Invoice | `INV_{Vendor}_{YYYYMMDD}.pdf` |
| Contract | `CONTRACT_{Counterparty}_{EffectiveDate}.pdf` |
| Correspondence | `EMAIL_{Subject}_{YYYYMMDD}.pdf` |

Document the pattern in your team wiki and onboarding deck.

### 2. Align connector sources

- Email: use subject prefixes `[AP]` or `[Legal]` for filter rules.
- SFTP: separate folders per document type before sync.
- SharePoint: one library per workspace where possible.

### 3. Upload in logical batches

1. Group files by project or month.
2. Upload one batch at a time.
3. Wait for pipeline **Complete** before validating search.
4. Run a spot-check [report](/docs/user-guide/reports) after each batch.

### 4. Handle duplicates

- Search before re-uploading.
- Remove or archive duplicates per retention policy.
- Log duplicate sources (connector + manual) in runbooks.

### 5. Review quarterly

- Failed documents list → zero or explained.
- Orphan test files removed.
- Classification tags still match business categories.

## Expected Results

- Faster human scan of document lists.
- Better AI retrieval when filenames and content align.
- Cleaner exports for auditors.

## Tips

Consistency beats complexity—a simple prefix scheme helps more than deep folder trees.

## Best Practices

- Train uploaders on naming before opening connectors to firehose mode.
- Keep sandbox/test documents in a separate workspace.
- Pair with [Security and Sensitivity](/docs/best-practices/security-sensitivity) for regulated content.

## Common Mistakes

- `Scan001.pdf` repeated hundreds of times.
- Mixing personal and work files in production workspace.
- Never reviewing failed pipeline items.

## Troubleshooting

Search cannot find misnamed files with poor OCR—re-upload higher-quality scan or rename and reprocess.

## Related Articles

- [Documents](/docs/user-guide/documents)
- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Connectors](/docs/user-guide/connectors)
- [Workspace Governance](/docs/best-practices/workspace-governance)

---
title: Reports
description: Export workspace data and document insights from Alonix as CSV, PDF, or XLSX reports.
sidebar_position: 9
---

# Reports

## Overview

**Reports** let you export structured data from your workspace for stakeholders, audits, and offline analysis. Alonix supports common formats including **CSV**, **PDF**, and **XLSX**.

## Purpose

Turn vault data and activity into shareable outputs without manual copy-paste from the UI.

## Prerequisites

- Workspace access with report permissions (typically all roles; confirm with admin)
- Documents and activity data in the workspace
- Correct workspace selected

## Step-by-Step Instructions

### 1. Open Reports

1. Select your workspace.
2. Click **Reports** in the sidebar.
3. Browse available report templates or builders.

[Screenshot – Reports page with report type selector and date range filters]

### 2. Choose a report type

Common report types may include:

| Report | Contents |
|--------|----------|
| Document inventory | File list, types, status, dates |
| Pipeline summary | Processing, complete, failed counts |
| User activity | Logins, uploads, exports (admin) |
| Classification summary | Tags and categories distribution |
| Custom export | Filtered document metadata |

### 3. Set filters and date range

1. Choose start and end dates.
2. Apply document type, status, or classification filters.
3. Preview row count if shown.

### 4. Select export format

1. Pick **CSV**, **PDF**, or **XLSX**.
2. Click **Generate** or **Export**.
3. Wait for processing—large reports may take a minute.

### 5. Download and share

1. Download the file when ready.
2. Share per your organization's data handling policy.
3. Store exports in approved locations only.

## Expected Results

- Accurate export matching selected filters and workspace scope.
- Readable PDF for executives; CSV/XLSX for analysts.
- Generation events logged in [Activity Logs](/docs/user-guide/activity-logs).

## Tips

- Schedule recurring exports after connector sync windows complete.
- CSV opens easily in Excel and Google Sheets for pivot tables.
- PDF works well for audit packets with fixed layouts.

## Best Practices

- Redact or filter sensitive columns before external sharing.
- Name exports with workspace and date (`Legal_Contracts_2025-06-30.csv`).
- Do not email unencrypted reports containing PII—use secure file transfer.

## Common Mistakes

- Exporting from wrong workspace—verify switcher first.
- Including failed/processing documents when stakeholders expect final inventory only.
- Treating reports as real-time—they reflect generation timestamp.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Export empty | Widen date range; confirm documents exist. |
| Export failed | Reduce scope; retry; contact admin if persistent. |
| Missing report type | Role or plan limitation. |
| Garbled characters in CSV | Open with UTF-8 encoding in Excel. |

## Related Articles

- [Generate Report Tutorial](/docs/tutorials/generate-report)
- [Activity Logs](/docs/user-guide/activity-logs)
- [Documents](/docs/user-guide/documents)
- [Security and Sensitivity](/docs/best-practices/security-sensitivity)

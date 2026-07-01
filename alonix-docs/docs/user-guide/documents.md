---
title: Documents
description: Store, search, preview, and manage documents in the Alonix document vault.
sidebar_position: 4
---

# Documents

## Overview

The **Documents** section is your workspace vault—a searchable library of every file uploaded manually or ingested through connectors. From here you preview content, check pipeline status, filter results, and download files (per your permissions).

## Purpose

Centralize document access so your team can find files by name, metadata, or full-text content without leaving Alonix.

## Prerequisites

- Access to a workspace
- Correct workspace selected — [Workspace Switcher](/docs/user-guide/workspace-switcher)
- Documents uploaded or synced — [Your First Document](/docs/getting-started/your-first-document)

## Step-by-Step Instructions

### 1. Open the document vault

1. Select your workspace in the top navigation.
2. Click **Documents** in the sidebar.
3. Browse the table or grid of documents.

[Screenshot – Documents vault with search bar, filters, and document list]

### 2. Upload documents

**Manual upload:**

1. Click **Upload** or drag files into the drop zone.
2. Select one or multiple files.
3. Wait for upload confirmation.
4. Monitor **status** until pipeline completes — see [Document Pipeline](/docs/user-guide/document-pipeline).

**Connector intake:** files appear automatically from Email, SFTP, or SharePoint — [Connectors](/docs/user-guide/connectors).

### 3. Search and filter

1. Use the **search box** for keywords in titles or extracted text.
2. Apply **filters** (date, type, classification, status) if available.
3. Click a row to open **preview** or details.

### 4. Preview and download

1. Click a document name.
2. View extracted text, metadata, and classification tags.
3. Use **Download** if your role allows exporting the original file.

### 5. Manage documents (admins)

Group Admins may delete, reprocess, or retag documents depending on org policy. Destructive actions are logged in [Activity Logs](/docs/user-guide/activity-logs).

## Expected Results

- All workspace documents visible in one list.
- Search returns relevant files after pipeline completion.
- Preview shows readable extracted content for supported formats.
- Status column reflects pipeline stage accurately.

## Tips

- Descriptive filenames improve scanability before metadata extraction completes.
- Filter by **Failed** status to fix pipeline issues quickly.
- Use AI Chat for questions across many documents; use Documents for locating a specific file.

## Best Practices

- Follow [Document Organization](/docs/best-practices/document-organization) for naming and folder conventions.
- Apply [Security and Sensitivity](/docs/best-practices/security-sensitivity) rules before uploading regulated data.
- Periodically review failed and duplicate documents.

## Common Mistakes

- Searching before pipeline completes and concluding content is missing.
- Uploading duplicates with identical content across multiple batches.
- Downloading sensitive files to unmanaged personal devices.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Document not in list | Check workspace switcher; wait for connector sync. |
| Preview empty | Scanned PDF may need OCR time; check pipeline status. |
| Upload failed | [Upload Problems](/docs/troubleshooting/upload-problems) |
| Cannot delete | Insufficient role—contact Group Admin. |

## Related Articles

- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Upload Document Tutorial](/docs/tutorials/upload-document)
- [AI Chat](/docs/user-guide/ai-chat)
- [Connectors](/docs/user-guide/connectors)

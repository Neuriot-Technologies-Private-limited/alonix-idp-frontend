---
title: Your First Document
description: Upload your first document to Alonix and follow it through ingest, extract, and classify.
sidebar_position: 7
---

# Your First Document

## Overview

Uploading a document is the fastest way to see Alonix in action. After upload, the **document pipeline** processes your file so it becomes searchable and available for AI Chat with citations.

## Purpose

Walk through a complete upload-to-search flow so you understand processing times, status indicators, and how to verify success.

## Prerequisites

- Logged in with access to a workspace — see [Your First Workspace](/docs/getting-started/your-first-workspace)
- A sample file (PDF, Word, or image) you are allowed to upload
- Correct workspace selected in the [workspace switcher](/docs/user-guide/workspace-switcher)

## Step-by-Step Instructions

### 1. Open Documents

1. Confirm the correct workspace in the top navigation.
2. Click **Documents** in the sidebar.
3. The document vault list loads (may be empty initially).

[Screenshot – Documents vault with Upload button highlighted]

### 2. Upload a file

1. Click **Upload** or drag a file into the upload area.
2. Select your sample document from your computer.
3. Wait for the upload progress indicator to complete.
4. The file appears in the list with a status such as **Processing** or **Queued**.

### 3. Monitor pipeline status

Documents move through these stages:

1. **Upload** — file received by Alonix
2. **Ingest** — file stored and indexed for processing
3. **Extract** — text and metadata pulled from the file
4. **Classify** — document type and tags assigned

Status updates on the document row and on the [Dashboard](/docs/getting-started/dashboard-overview). Full details: [Document Pipeline](/docs/user-guide/document-pipeline).

### 4. Verify search and preview

When status shows **Complete** or **Ready**:

1. Click the document name to open preview.
2. Use the search box in Documents to find a unique word or phrase from the file.
3. Confirm the document appears in results.

### 5. Try AI Chat (optional)

1. Open **AI Chat** in the sidebar.
2. Ask a question answerable from your uploaded file (e.g., "What is the invoice total?").
3. Check that the response includes **citations** linking to your document.

See [AI Chat](/docs/user-guide/ai-chat) and the [Ask AI tutorial](/docs/tutorials/ask-ai).

## Expected Results

- File appears in the Documents vault for the active workspace.
- Pipeline completes without errors (or shows a clear error message if not).
- Search returns the document by content.
- AI Chat cites the document when relevant.

## Tips

- Start with a text-based PDF or Word file—scanned images may take longer (OCR).
- Upload during stable network conditions for large files.
- Check the Dashboard if status seems stuck for more than a few minutes.

## Best Practices

- Use descriptive filenames before upload (`Invoice_Acme_2025-03.pdf`).
- Upload non-sensitive test files first during onboarding.
- Review [Document Organization](/docs/best-practices/document-organization) before bulk imports.

## Common Mistakes

- Uploading to the wrong workspace.
- Assuming instant AI answers while status is still **Processing**.
- Uploading password-protected PDFs without unlocking them first.

## Troubleshooting

| Issue | Action |
|-------|--------|
| Upload fails | See [Upload Problems](/docs/troubleshooting/upload-problems). |
| Stuck on Processing | Wait; retry upload if exceeds expected time. |
| Search finds nothing | Confirm pipeline Complete; check spelling. |
| AI Chat no citations | Ensure document finished processing; ask a specific question. |

## Related Articles

- [Documents (User Guide)](/docs/user-guide/documents)
- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Upload Document Tutorial](/docs/tutorials/upload-document)
- [AI Chat](/docs/user-guide/ai-chat)

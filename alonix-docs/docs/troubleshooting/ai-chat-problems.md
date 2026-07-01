---
title: AI Chat Problems
description: Troubleshoot missing answers, weak citations, and slow AI Chat in {{brandName}}.
sidebar_position: 4
---

# AI Chat Problems

## Overview

AI Chat depends on processed documents in your workspace. Issues usually trace to empty vaults, pipeline delays, vague questions, or workspace context—not "broken AI."

## Purpose

Improve answer quality and fix access issues through systematic checks.

## Prerequisites

- AI Chat menu visible (role permitted)
- At least one document ideally in **Complete** state

## Step-by-Step Instructions

### 1. Verify workspace context

1. Confirm correct workspace in switcher.
2. AI Chat never searches other Groups.

### 2. Confirm document readiness

1. Open **Documents**.
2. Filter status **Complete**.
3. If zero, upload or wait for [pipeline](/docs/user-guide/document-pipeline).

### 3. Improve your question

| Weak | Strong |
|------|--------|
| "Summarize everything" | "What is the payment term in the Acme contract?" |
| "Any issues?" | "List invoices over $10,000 from Q1 2025" |

Include names, dates, document types.

### 4. Evaluate citations

1. If answer has **no citations**, treat as unreliable.
2. Click citations—does source support the claim?
3. If wrong doc cited, rephrase with more specifics.

[Screenshot – AI response with citation chips highlighted]

### 5. Handle "no relevant documents"

- Content may not exist in vault.
- Synonym mismatch—try alternate terms from known documents.
- Document still **Processing**.

### 6. Performance issues

- Retry after 30 seconds.
- Shorter question.
- Peak load—try off-peak if persistent.

### 7. Escalate when needed

Provide admin: workspace, question (redacted), time, screenshot, document IDs cited (if any).

## Expected Results

Cited answers from Complete documents; clear messaging when sources absent.

## Tips

Run [Ask AI tutorial](/docs/tutorials/ask-ai) with a file you know well to calibrate expectations.

## Best Practices

Never use AI Chat as sole authority for regulated decisions—verify citations.

## Common Mistakes

Chatting in empty sandbox workspace expecting production data.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No citations | No matching docs | Upload/wait/rephrase |
| Wrong answer | Ambiguous sources | Narrow question; verify cite |
| Chat missing | Role/plan | Contact admin |
| Timeout | Load/size | Retry simpler query |

## Related Articles

- [AI Chat](/docs/user-guide/ai-chat)
- [Ask AI Tutorial](/docs/tutorials/ask-ai)
- [Document Pipeline](/docs/user-guide/document-pipeline)
- [Common Issues](/docs/troubleshooting/common-issues)

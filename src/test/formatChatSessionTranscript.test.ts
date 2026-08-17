import { describe, expect, it, vi } from 'vitest';
import {
  buildChatTranscriptFilename,
  downloadTextFile,
  formatChatSessionTranscript,
} from '../pages/chat/utils/formatChatSessionTranscript';

describe('formatChatSessionTranscript', () => {
  it('formats session metadata and Q&A turns for audit download', () => {
    const text = formatChatSessionTranscript({
      title: 'Claim 8801',
      exportedAt: new Date('2026-08-17T06:00:00.000Z'),
      messages: [
        {
          query: 'What is the insured name?',
          answer: 'Acme Corp',
          sources: [{ title: 'policy.pdf', page: 3 }],
        },
        {
          query: 'Which doctor?',
          answer: 'Please specify.',
          response_kind: 'clarification',
        },
      ],
    });

    expect(text).toContain('Title: Claim 8801');
    expect(text).not.toContain('Session ID');
    expect(text).toContain('Exported: 2026-08-17T06:00:00.000Z');
    expect(text).toContain('Question:\nWhat is the insured name?');
    expect(text).toContain('Answer:\nAcme Corp');
    expect(text).toContain('- policy.pdf, page 3');
    expect(text).toContain('Clarification:\nPlease specify.');
    expect(text).toContain('--- Turn 2 ---');
  });

  it('omits page when the source has no valid page number', () => {
    const text = formatChatSessionTranscript({
      title: 'Claim 8801',
      exportedAt: new Date('2026-08-17T06:00:00.000Z'),
      messages: [
        {
          query: 'Q',
          answer: 'A',
          sources: [{ title: 'policy.pdf', page: 0 }, { file_name: 'note.pdf', page_number: 12 }],
        },
      ],
    });
    expect(text).toContain('- policy.pdf\n');
    expect(text).toContain('- note.pdf, page 12');
  });

  it('strips HTML from answers so the file is readable plaintext', () => {
    const text = formatChatSessionTranscript({
      title: 'HTML',
      exportedAt: new Date('2026-08-17T00:00:00.000Z'),
      messages: [{ query: 'Q', answer: '<p>Hello <b>world</b></p>' }],
    });
    expect(text).toContain('Answer:\nHello world');
    expect(text).not.toContain('<p>');
  });

  it('writes an empty-session note instead of throwing', () => {
    const text = formatChatSessionTranscript({
      messages: [],
      exportedAt: new Date('2026-08-17T00:00:00.000Z'),
    });
    expect(text).toContain('No messages in this session.');
  });
});

describe('buildChatTranscriptFilename', () => {
  it('slugs the title and stamps the date', () => {
    expect(
      buildChatTranscriptFilename('Claim #8801 / Acme', new Date('2026-08-17T12:00:00.000Z'))
    ).toBe('chat-claim-8801-acme-2026-08-17.txt');
  });

  it('falls back to untitled when the title is blank', () => {
    expect(buildChatTranscriptFilename('   ', new Date('2026-08-17T00:00:00.000Z'))).toBe(
      'chat-untitled-2026-08-17.txt'
    );
  });
});

describe('downloadTextFile', () => {
  it('creates an object URL, clicks an anchor, and revokes the URL', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    (URL as unknown as { createObjectURL: typeof createObjectURL }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: typeof revokeObjectURL }).revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadTextFile('chat.txt', 'hello');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    clickSpy.mockRestore();
  });
});

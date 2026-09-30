import { describe, expect, it } from 'vitest';
import { applySessionUserId } from '../services/authApi';

describe('applySessionUserId', () => {
  it('restores id and _id onto a rehydrated email-only profile', () => {
    const user = applySessionUserId(
      { email: 'a@example.com', username: 'a@example.com' },
      'user-1'
    );
    expect(user.id).toBe('user-1');
    expect(user._id).toBe('user-1');
    expect(user.email).toBe('a@example.com');
  });

  it('keeps an id already on the profile when the server omits one', () => {
    const user = applySessionUserId(
      { email: 'a@example.com', username: 'a@example.com', id: 'kept' },
      ''
    );
    expect(user.id).toBe('kept');
    expect(user._id).toBe('kept');
  });
});

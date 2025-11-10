import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocks
const getIdToken = vi.fn();
let callableImpl: any;

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => {
    return async (payload: any) => callableImpl(payload);
  }),
}));

vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { getIdToken },
  },
  functions: {},
}));

import { elevateUserToAdmin } from '@/lib/services/adminElevation';
import { auth } from '@/lib/firebase';

describe('adminElevation service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).currentUser = { getIdToken };
  });

  it('throws when unauthenticated', async () => {
    (auth as any).currentUser = null;
    await expect(elevateUserToAdmin('target-uid-123')).rejects.toThrow('User must be authenticated');
  });

  it('calls callable function and refreshes token on success', async () => {
    callableImpl = async (_payload: any) => ({ data: { message: 'User elevated to admin' } });
    const res = await elevateUserToAdmin('target-uid-123');
    expect(res.success).toBe(true);
    expect(res.message).toContain('Elevation');
    expect(getIdToken).toHaveBeenCalledWith(true);
  });

  it('maps permission denied errors', async () => {
    callableImpl = async () => { const err: any = new Error('Denied'); err.code = 'functions/permission-denied'; throw err; };
    await expect(elevateUserToAdmin('target-uid-123')).rejects.toThrow('Permission denied');
  });

  it('maps invalid argument errors', async () => {
    callableImpl = async () => { const err: any = new Error('Invalid'); err.code = 'functions/invalid-argument'; throw err; };
    await expect(elevateUserToAdmin('bad')).rejects.toThrow('Invalid input');
  });

  it('maps unauthenticated errors', async () => {
    callableImpl = async () => { const err: any = new Error('Auth'); err.code = 'functions/unauthenticated'; throw err; };
    await expect(elevateUserToAdmin('target-uid-123')).rejects.toThrow('Unauthenticated');
  });

  it('maps rate limit errors', async () => {
    callableImpl = async () => { const err: any = new Error('Too many'); err.code = 'functions/resource-exhausted'; throw err; };
    await expect(elevateUserToAdmin('target-uid-123')).rejects.toThrow('Too many requests');
  });

  it('falls back to generic error message', async () => {
    callableImpl = async () => { throw new Error('Network fail'); };
    await expect(elevateUserToAdmin('target-uid-123')).rejects.toThrow('Network or server error');
  });
});
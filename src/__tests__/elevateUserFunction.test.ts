import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock firebase-functions to extract the handler function
class MockHttpsError extends Error {
  code: string;
  details?: any;
  constructor(code: string, message?: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const functionsMock = {
  https: {
    HttpsError: MockHttpsError,
    onCall: (handler: any) => handler,
  },
  region: vi.fn(() => ({
    runWith: vi.fn(() => ({
      https: { onCall: (handler: any) => handler },
    })),
  })),
  logger: { info: vi.fn(), error: vi.fn() },
};

vi.mock('firebase-functions', () => ({
  default: functionsMock,
  ...functionsMock,
}));

// Mocks for firebase-admin
const getUser = vi.fn();
const setCustomUserClaims = vi.fn();
const add = vi.fn();
const collection = vi.fn(() => ({ add }));
const FieldValue = { serverTimestamp: vi.fn(() => 'serverTime') };
const firestore = vi.fn(() => ({ collection }));
// Attach FieldValue to the firestore function to match admin.firestore.FieldValue access
(firestore as any).FieldValue = FieldValue;

vi.mock('firebase-admin', () => ({
  default: {
    auth: () => ({ getUser, setCustomUserClaims }),
    firestore,
  },
  auth: () => ({ getUser, setCustomUserClaims }),
  firestore,
}));

// Mock utils
let rateLimitOk = true;
let userExistsVal = true;
vi.mock('../../functions/src/rewards/utils', () => ({
  checkRateLimit: vi.fn(() => rateLimitOk),
  userExists: vi.fn(async () => userExistsVal),
}));

// Import the callable handler (our mocks return the inner handler directly)
import { elevateUserToAdmin } from '../../functions/src/admin/elevateUser';

const ctx = (claims: any = { admin: true }) => ({
  auth: { uid: 'requester123', token: claims },
});

describe('elevateUserToAdmin Cloud Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitOk = true;
    userExistsVal = true;
  });

  it('elevates user to admin when requester is admin and target exists', async () => {
    getUser.mockResolvedValueOnce({ customClaims: { foo: 'bar' } });
    setCustomUserClaims.mockResolvedValueOnce(undefined);

    const res = await elevateUserToAdmin({ targetUid: 'target-uid-123' }, ctx());
    expect(res.success).toBe(true);
    expect(res.targetUid).toBe('target-uid-123');
    expect(setCustomUserClaims).toHaveBeenCalledWith('target-uid-123', expect.objectContaining({ admin: true, role: 'admin' }));
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ type: 'elevateUserToAdmin', targetUid: 'target-uid-123', requesterUid: 'requester123' }));
  });

  it('denies non-admin requester', async () => {
    await expect(elevateUserToAdmin({ targetUid: 'target-uid-123' }, ctx({ admin: false }))).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('rejects unauthenticated requester', async () => {
    await expect(elevateUserToAdmin({ targetUid: 'target-uid-123' }, { auth: null } as any)).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('validates invalid target uid length', async () => {
    await expect(elevateUserToAdmin({ targetUid: '123' }, ctx())).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('enforces rate limiting', async () => {
    rateLimitOk = false;
    await expect(elevateUserToAdmin({ targetUid: 'target-uid-123' }, ctx())).rejects.toMatchObject({ code: 'resource-exhausted' });
  });

  it('returns not-found when target user does not exist', async () => {
    userExistsVal = false;
    await expect(elevateUserToAdmin({ targetUid: 'target-uid-123' }, ctx())).rejects.toMatchObject({ code: 'not-found' });
  });

  it('maps unexpected errors to internal', async () => {
    getUser.mockResolvedValueOnce({ customClaims: {} });
    setCustomUserClaims.mockRejectedValueOnce(new Error('db down'));
    await expect(elevateUserToAdmin({ targetUid: 'target-uid-123' }, ctx())).rejects.toMatchObject({ code: 'internal' });
  });
});
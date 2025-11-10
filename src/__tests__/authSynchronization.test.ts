import { describe, it, expect, vi } from 'vitest';
import { verifyFirebaseToken, resolveUserRole, setFirebaseCustomClaims } from '@/lib/auth/firebaseAuth';
import { adminAuth } from '@/lib/firebase/admin';

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
    getUser: vi.fn(),
    setCustomUserClaims: vi.fn(),
  },
}));

// Mock ENV
vi.mock('@/lib/env', () => ({
  ENV: {
    ALLOWED_ADMIN_EMAILS: ['admin@example.com', 'test@broskis.kitchen'],
  },
}));

describe('Firebase Authentication Synchronization', () => {
  describe('verifyFirebaseToken', () => {
    it('should extract admin claim from Firebase token', async () => {
      const mockToken = 'mock-firebase-token';
      const mockDecodedToken = {
        uid: 'test-user-123',
        email: 'test@example.com',
        admin: true,
      };

      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken as any);

      const result = await verifyFirebaseToken(mockToken);

      expect(result).toEqual({
        uid: 'test-user-123',
        email: 'test@example.com',
        admin: true,
      });
      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith(mockToken);
    });

    it('should handle non-admin users', async () => {
      const mockToken = 'mock-firebase-token';
      const mockDecodedToken = {
        uid: 'regular-user-456',
        email: 'user@example.com',
        // No admin claim
      };

      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue(mockDecodedToken as any);

      const result = await verifyFirebaseToken(mockToken);

      expect(result).toEqual({
        uid: 'regular-user-456',
        email: 'user@example.com',
        admin: false, // Should default to false
      });
    });

    it('should return null for invalid tokens', async () => {
      const mockToken = 'invalid-token';

      vi.mocked(adminAuth.verifyIdToken).mockRejectedValue(new Error('Invalid token'));

      const result = await verifyFirebaseToken(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('resolveUserRole', () => {
    it('should prefer Firebase admin claim over email allowlist', async () => {
      const uid = 'test-user-123';
      const email = 'user@example.com'; // Not in allowlist
      
      vi.mocked(adminAuth.getUser).mockResolvedValue({
        customClaims: { admin: true },
      } as any);

      const result = await resolveUserRole(uid, email);

      expect(result).toBe('admin'); // Should be admin due to Firebase claim
    });

    it('should fallback to email allowlist when Firebase claim is false', async () => {
      const uid = 'test-user-456';
      const email = 'admin@example.com'; // In allowlist
      
      vi.mocked(adminAuth.getUser).mockResolvedValue({
        customClaims: { admin: false },
      } as any);

      const result = await resolveUserRole(uid, email);

      expect(result).toBe('admin'); // Should be admin due to email allowlist
    });

    it('should return user when neither Firebase claim nor email allowlist indicates admin', async () => {
      const uid = 'test-user-789';
      const email = 'user@example.com'; // Not in allowlist
      
      vi.mocked(adminAuth.getUser).mockResolvedValue({
        customClaims: { admin: false },
      } as any);

      const result = await resolveUserRole(uid, email);

      expect(result).toBe('user');
    });

    it('should handle errors gracefully', async () => {
      const uid = 'error-user';
      const email = 'admin@example.com'; // In allowlist
      
      vi.mocked(adminAuth.getUser).mockRejectedValue(new Error('User not found'));

      const result = await resolveUserRole(uid, email);

      expect(result).toBe('admin'); // Should fallback to email allowlist
    });
  });

  describe('setFirebaseCustomClaims', () => {
    it('should set custom claims successfully', async () => {
      const uid = 'test-user-123';
      const claims = { admin: true, role: 'super_admin' };

      vi.mocked(adminAuth.setCustomUserClaims).mockResolvedValue();

      await setFirebaseCustomClaims(uid, claims);

      expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith(uid, claims);
    });

    it('should throw error when setting claims fails', async () => {
      const uid = 'test-user-456';
      const claims = { admin: true };
      const error = new Error('Permission denied');

      vi.mocked(adminAuth.setCustomUserClaims).mockRejectedValue(error);

      await expect(setFirebaseCustomClaims(uid, claims)).rejects.toThrow('Permission denied');
    });
  });
});
"use client";
import React, { useState } from 'react';
import { elevateUserToAdmin } from '@/lib/services/adminElevation';

export default function ElevateUserForm() {
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await elevateUserToAdmin(uid.trim());
      setMessage(res.message || 'User elevated to admin');
    } catch (err: any) {
      setError(err?.message || 'Failed to elevate user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 480 }}>
      <h3>Elevate User to Admin</h3>
      <label htmlFor="uid">Target User UID</label>
      <input
        id="uid"
        type="text"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        placeholder="Enter Firebase UID"
        required
        minLength={6}
      />
      <button type="submit" disabled={loading || uid.trim().length < 6}>
        {loading ? 'Elevating...' : 'Elevate to Admin'}
      </button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { AuthState, Claims } from '@/types/auth';

export function useAuthUser(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    claims: {},
    loading: true
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        return setState({ user: null, claims: {}, loading: false });
      }

      const token = await getIdTokenResult(user, true);
      setState({
        user,
        claims: (token.claims ?? {}) as Claims,
        loading: false
      });
    });
  }, []);

  return state;
}
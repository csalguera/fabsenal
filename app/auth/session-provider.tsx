"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type SessionPayload = {
  uid: string;
  email: string | null;
  isAdmin: boolean;
};

type AuthSessionContextValue = {
  user: User | null;
  idToken: string | null;
  isAdmin: boolean;
  loading: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue>({
  user: null,
  idToken: null,
  isAdmin: false,
  loading: true,
});

async function resolveSession(token: string) {
  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SessionPayload;
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      setLoading(true);

      if (!nextUser) {
        setUser(null);
        setIdToken(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(nextUser);

      try {
        const token = await nextUser.getIdToken();
        setIdToken(token);

        const session = await resolveSession(token);
        setIsAdmin(Boolean(session?.isAdmin));
      } catch (error) {
        console.error("Failed to resolve auth session", error);
        setIdToken(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, idToken, isAdmin, loading }),
    [user, idToken, isAdmin, loading],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}

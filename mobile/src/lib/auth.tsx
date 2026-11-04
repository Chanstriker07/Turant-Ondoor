import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setAuthToken, setUnauthorizedHandler } from "./api";
import { storage } from "./storage";
import type { User } from "./types";

const TOKEN_KEY = "turant_token";

interface AuthState {
  user: User | null;
  ready: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await storage.remove(TOKEN_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(await api<User>("/auth/me"));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    (async () => {
      const token = await storage.get(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          await refreshUser();
        } catch {
          await signOut();
        }
      }
      setReady(true);
    })();
  }, [refreshUser, signOut]);

  const setToken = async (token: string) => {
    setAuthToken(token);
    await storage.set(TOKEN_KEY, token);
  };

  const signIn = async (token: string, u: User) => {
    await setToken(token);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut, refreshUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

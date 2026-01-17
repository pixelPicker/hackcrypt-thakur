"use client";
import { getSession, useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useState } from "react";

type Session = {
  authenticated: boolean;
  credits_left: number | null;
  user?: {
    email: string;
  };
};

const SessionContext = createContext<{
  session: Session | null;
  refresh: () => Promise<void>;
}>({
  session: null,
  refresh: async () => {},
});

export function SessionsProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const fetchSession = async () => {
    const actualUserSession = await getSession();
    const res = await fetch(
      `http://localhost:8000/me${actualUserSession ? "?mode=user" : ""}`,
      {
        credentials: "include",
      },
    );
    const data = await res.json();
    setSession(data);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session, refresh: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessions = () => useContext(SessionContext);

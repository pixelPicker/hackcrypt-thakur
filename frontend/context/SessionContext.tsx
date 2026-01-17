"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Session = {
  authenticated: boolean;
  credits_left: number;
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
    const res = await fetch("http://localhost:8000/me", {
      credentials: "include",
    });
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

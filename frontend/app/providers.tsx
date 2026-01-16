"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => createQueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

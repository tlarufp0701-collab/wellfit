"use client";

import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "./ui";
import { NextNavProvider } from "./next-nav";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextNavProvider>
      <StoreProvider>
        <ToastProvider>{children}</ToastProvider>
      </StoreProvider>
    </NextNavProvider>
  );
}

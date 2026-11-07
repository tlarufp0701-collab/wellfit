"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { NavProvider, type LinkProps } from "@/lib/nav";

function NextLink({ href, className, children, onClick, ...rest }: LinkProps) {
  return (
    <Link href={href} className={className} onClick={onClick} aria-label={rest["aria-label"]}>
      {children}
    </Link>
  );
}

export function NextNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  return <NavProvider value={{ pathname, push: (h) => router.push(h), Link: NextLink }}>{children}</NavProvider>;
}

"use client";

import { createContext, useContext, type ComponentType, type ReactNode } from "react";

/**
 * 라우팅 추상화. Next.js 앱에서는 next/link + next/navigation을,
 * 단일 파일 프로토타입 빌드에서는 해시 라우터를 주입한다.
 */
export interface LinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
}

export interface Nav {
  pathname: string;
  push: (href: string) => void;
  Link: ComponentType<LinkProps>;
}

const NavCtx = createContext<Nav | null>(null);

export function NavProvider({ value, children }: { value: Nav; children: ReactNode }) {
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

export function useNav() {
  const v = useContext(NavCtx);
  if (!v) throw new Error("NavProvider missing");
  return v;
}

export function AppLink(props: LinkProps) {
  const { Link } = useNav();
  return <Link {...props} />;
}

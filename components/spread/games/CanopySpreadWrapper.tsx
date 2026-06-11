"use client";

import { CanopyGameProvider } from "./CanopyGameContext";

interface CanopySpreadWrapperProps {
  spreadId: string;
  children: React.ReactNode;
}

export function CanopySpreadWrapper({
  spreadId,
  children,
}: CanopySpreadWrapperProps) {
  if (spreadId === "spread-3") {
    return <CanopyGameProvider>{children}</CanopyGameProvider>;
  }
  return <>{children}</>;
}

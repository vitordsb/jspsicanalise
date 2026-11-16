/** Chip informativo (M3 assist chip, sem acao): rotulo curto com icone opcional. */

import type { ReactNode } from "react";
import { clsx } from "clsx";

export function Chip({
  icone,
  children,
  className,
}: {
  icone?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-outline-variant",
        "bg-white text-xs font-semibold text-primary",
        className
      )}
    >
      {icone}
      {children}
    </span>
  );
}

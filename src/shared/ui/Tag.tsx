import type { HTMLAttributes } from "react";

export function Tag({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
    return <span {...props} className={`max-w-full rounded-[11px] border border-border bg-chip px-2.5 py-1.5 text-sm leading-tight font-semibold text-muted ${className}`} />;
}

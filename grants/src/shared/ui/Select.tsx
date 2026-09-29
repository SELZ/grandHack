import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={`h-11 min-w-0 rounded-[10px] border border-white/20 bg-background/40 px-3 text-base text-foreground outline-none transition-colors focus:border-white/45 focus:ring-2 focus:ring-white/10 focus:ring-offset-0 motion-reduce:transition-none ${className}`}
        />
    );
}

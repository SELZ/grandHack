import type { ButtonHTMLAttributes } from "react";

export function IconButton({ className = "", type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={`inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-[10px] p-1.5 text-muted outline-none transition-colors hover:bg-white/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 disabled:cursor-default motion-reduce:transition-none ${className}`}
        />
    );
}

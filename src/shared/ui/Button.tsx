import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
};

const variants = {
    primary: "border border-white/25 bg-white/20 text-foreground hover:bg-white/25",
    secondary: "border border-white/15 bg-black/10 text-foreground/80 hover:bg-white/10 hover:text-foreground",
};

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
    return (
        <button
            {...props}
            data-ui-motion
            type={type}
            className={`inline-flex min-h-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-[14px] px-4.5 py-2.5 text-base leading-[22px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 disabled:cursor-default disabled:opacity-50 motion-reduce:transition-none ${variants[variant]} ${className}`}
        />
    );
}

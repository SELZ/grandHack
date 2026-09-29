import type { ReactNode } from "react";

type IconName = "search" | "star" | "home" | "user" | "chat" | "arrow" | "close" | "calendar" | "external" | "filter";

const paths: Record<IconName, ReactNode> = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    star: <path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9L12 3Z" />,
    home: <><path d="m3 10 9-8 9 8" /><path d="M5 8.3V22h14V8.3" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 22v-2a8 8 0 0 1 16 0v2" /></>,
    chat: <path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.4-4.7A9 9 0 1 1 21 11.5Z" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18" /></>,
    external: <><path d="M14 4h6v6M20 4 10 14" /><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /></>,
    filter: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" /><circle cx="15" cy="17" r="2" /></>,
};

export function Icon({ name, filled = false, className = "size-6" }: {
    name: IconName;
    filled?: boolean;
    className?: string;
}) {
    return (
        <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {paths[name]}
        </svg>
    );
}

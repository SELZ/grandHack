import { useState } from "react";
import type { ReactNode } from "react";
import { useDialogMotion } from "@/shared/lib/use-dialog-motion";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    titleId: string;
    descriptionId?: string;
    children: ReactNode;
    className?: string;
    closeLabel?: string;
};

export function Modal({ open, onClose, titleId, descriptionId, children, className = "max-w-2xl", closeLabel = "Закрыть окно" }: ModalProps) {
    const [retainedChildren, setRetainedChildren] = useState<ReactNode>(open ? children : null);
    if (open && retainedChildren !== children) setRetainedChildren(children);
    const { dialogRef, panelRef, requestClose, dialogHandlers } = useDialogMotion({
        open,
        onClose,
        onAfterClose: () => setRetainedChildren(null),
    });

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none items-center justify-center overflow-hidden border-0 bg-transparent p-4 text-foreground outline-none [--dialog-backdrop-opacity:0] open:flex backdrop:bg-black/65 backdrop:opacity-[var(--dialog-backdrop-opacity)] backdrop:backdrop-blur-xs md:p-8"
            {...dialogHandlers}
        >
            <div
                ref={panelRef}
                data-dialog-panel
                className={`relative max-h-[calc(100dvh-32px)] w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl border border-border bg-surface p-6 shadow-2xl md:max-h-[calc(100dvh-64px)] md:p-8 ${className}`}
            >
                <IconButton className="absolute top-3 right-3 border border-border bg-chip md:top-4 md:right-4" onClick={requestClose} aria-label={closeLabel}>
                    <Icon name="close" />
                </IconButton>
                {open ? children : retainedChildren}
            </div>
        </dialog>
    );
}

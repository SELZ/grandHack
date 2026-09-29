import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

/** Movement only; control colors and focus remain Tailwind states. */
export function useUiMotion(rootRef: RefObject<HTMLElement | null>, view: string) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
            // Keep only in-flight/hovered targets, not every tween in a long-lived context.
            const tweens = new Map<HTMLElement, gsap.core.Tween>();
            const moved = new Set<HTMLElement>();
            const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
            const targetOf = (event: PointerEvent) => event.target instanceof Element
                ? event.target.closest<HTMLElement>("[data-ui-motion]:not(:disabled)") : null;
            function move(event: PointerEvent) {
                const target = targetOf(event);
                if (!target || !root?.contains(target)) return;
                if ((event.type === "pointerover" || event.type === "pointerout") && event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
                const press = event.type === "pointerdown";
                const hover = finePointer.matches && (event.type === "pointerover" || event.type === "pointerup");
                tweens.get(target)?.kill();
                moved.add(target);
                const atRest = !press && !(hover && target.dataset.uiMotion === "lift");
                const tween = gsap.to(target, {
                    y: hover && target.dataset.uiMotion === "lift" ? -2 : 0,
                    scale: press ? 0.985 : 1,
                    duration: press ? 0.12 : 0.2,
                    ease: "power2.out",
                    overwrite: "auto",
                    onComplete: () => {
                        tweens.delete(target);
                        if (atRest) {
                            gsap.set(target, { clearProps: "transform" });
                            moved.delete(target);
                        }
                    },
                });
                tweens.set(target, tween);
            }
            const events = ["pointerover", "pointerout", "pointerdown", "pointerup", "pointercancel"] as const;
            events.forEach((name) => root.addEventListener(name, move));
            return () => {
                events.forEach((name) => root.removeEventListener(name, move));
                tweens.forEach((tween) => tween.kill());
                moved.forEach((target) => gsap.set(target, { clearProps: "transform" }));
            };
        });
        return () => media.revert();
    }, [rootRef, view]);
}

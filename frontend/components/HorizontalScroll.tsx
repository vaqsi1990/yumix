"use client";

import { ReactNode, useEffect, useRef } from "react";

type HorizontalScrollProps = {
  children: ReactNode;
  className?: string;
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'a, button, input, textarea, select, label, [role="button"]',
    ),
  );
}

export default function HorizontalScroll({
  children,
  className = "",
}: HorizontalScrollProps) {
  const ref = useRef<HTMLUListElement>(null);
  const drag = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      if (isInteractiveTarget(e.target)) return;
      drag.current.active = true;
      drag.current.moved = false;
      drag.current.startX = e.clientX;
      drag.current.scrollLeft = el!.scrollLeft;
      el!.setPointerCapture(e.pointerId);
      el!.classList.add("cursor-grabbing");
      el!.classList.remove("cursor-grab");
    }

    function onPointerMove(e: PointerEvent) {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > 3) drag.current.moved = true;
      el!.scrollLeft = drag.current.scrollLeft - dx;
    }

    function onPointerUp(e: PointerEvent) {
      if (!drag.current.active) return;
      drag.current.active = false;
      el!.releasePointerCapture(e.pointerId);
      el!.classList.add("cursor-grab");
      el!.classList.remove("cursor-grabbing");
    }

    function onClickCapture(e: MouseEvent) {
      if (isInteractiveTarget(e.target)) return;
      if (drag.current.moved) {
        e.preventDefault();
        e.stopPropagation();
        drag.current.moved = false;
      }
    }

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el!.scrollWidth <= el!.clientWidth) return;
      e.preventDefault();
      el!.scrollLeft += e.deltaY;
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <ul
      ref={ref}
      className={`cursor-grab select-none overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {children}
    </ul>
  );
}

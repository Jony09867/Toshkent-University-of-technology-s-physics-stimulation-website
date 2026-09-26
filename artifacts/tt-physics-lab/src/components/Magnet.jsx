import { useEffect, useRef, useState } from "react";

export default function Magnet({
  children,
  padding = 48,
  disabled = false,
  magnetStrength = 18,
  wrapperClassName = "",
  innerClassName = "",
  ...props
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (disabled || window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return undefined;
    const move = event => {
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const inside = Math.abs(centerX - event.clientX) < rect.width / 2 + padding &&
        Math.abs(centerY - event.clientY) < rect.height / 2 + padding;
      setPosition(inside
        ? { x: (event.clientX - centerX) / magnetStrength, y: (event.clientY - centerY) / magnetStrength }
        : { x: 0, y: 0 });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [disabled, magnetStrength, padding]);

  return (
    <div ref={ref} className={wrapperClassName} style={{ display: "inline-block" }} {...props}>
      <div
        className={innerClassName}
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)`, transition: "transform .35s cubic-bezier(.2,.8,.2,1)" }}
      >
        {children}
      </div>
    </div>
  );
}

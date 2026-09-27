import { useEffect, useRef, useState } from "react";

export function attachMagnet(
  wrapper,
  {
    padding = 50,
    magnetStrength = 32,
    activeTransition = "transform .22s ease-out",
    inactiveTransition = "transform .42s cubic-bezier(.2,.8,.2,1)",
  } = {},
) {
  if (!wrapper) return () => {};
  const target = wrapper.firstElementChild || wrapper;
  const motionDisabled = window.matchMedia(
    "(pointer: coarse), (prefers-reduced-motion: reduce)",
  ).matches;
  if (motionDisabled) return () => {};

  let frame = 0;
  target.style.willChange = "transform";
  const move = (event) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const { left, top, width, height } = wrapper.getBoundingClientRect();
      const centerX = left + width / 2,
        centerY = top + height / 2,
        inside =
          Math.abs(centerX - event.clientX) < width / 2 + padding &&
          Math.abs(centerY - event.clientY) < height / 2 + padding;
      target.style.transition = inside ? activeTransition : inactiveTransition;
      target.style.transform = inside
        ? `translate3d(${(event.clientX - centerX) / magnetStrength}px, ${(event.clientY - centerY) / magnetStrength}px, 0)`
        : "translate3d(0, 0, 0)";
    });
  };
  window.addEventListener("pointermove", move, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", move);
    target.style.removeProperty("transform");
    target.style.removeProperty("transition");
    target.style.removeProperty("will-change");
  };
}

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

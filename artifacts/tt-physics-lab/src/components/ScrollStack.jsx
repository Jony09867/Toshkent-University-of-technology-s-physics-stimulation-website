import { Children, cloneElement, isValidElement, useLayoutEffect, useRef } from "react";
import "./ScrollStack.css";

export function ScrollStackItem({ children, itemClassName = "", stackIndex = 0 }) {
  return (
    <article
      className={`scroll-stack-card ${itemClassName}`.trim()}
      style={{ "--stack-index": stackIndex }}
    >
      {children}
    </article>
  );
}

export default function ScrollStack({
  children,
  className = "",
  itemDistance = 120,
  itemScale = 0.025,
  itemStackDistance = 18,
  stackPosition = "12%",
  baseScale = 0.9,
  blurAmount = 0.8,
}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(max-width: 760px), (prefers-reduced-motion: reduce)").matches) return undefined;
    const cards = [...root.querySelectorAll(".scroll-stack-card")];
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const pinLine = stackPosition.includes("%")
        ? viewport * parseFloat(stackPosition) / 100
        : parseFloat(stackPosition);
      let current = -1;
      cards.forEach((card, index) => {
        if (card.getBoundingClientRect().top <= pinLine + itemStackDistance * index + 3) current = index;
      });
      cards.forEach((card, index) => {
        const depth = Math.max(0, current - index);
        const targetScale = Math.max(baseScale, 1 - depth * itemScale);
        card.style.setProperty("--stack-scale", targetScale.toFixed(3));
        card.style.setProperty("--stack-blur", `${(depth * blurAmount).toFixed(2)}px`);
      });
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [baseScale, blurAmount, itemScale, itemStackDistance, stackPosition]);

  const items = Children.map(children, (child, index) =>
    isValidElement(child) ? cloneElement(child, { stackIndex: index }) : child,
  );

  return (
    <div
      className={`scroll-stack ${className}`.trim()}
      ref={ref}
      style={{ "--stack-gap": `${itemDistance}px`, "--stack-distance": `${itemStackDistance}px`, "--stack-top": stackPosition }}
    >
      {items}
    </div>
  );
}

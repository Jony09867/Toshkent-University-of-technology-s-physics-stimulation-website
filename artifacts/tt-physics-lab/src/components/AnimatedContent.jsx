import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AnimatedContent({
  children,
  container,
  distance = 48,
  direction = "vertical",
  reverse = false,
  duration = 0.85,
  ease = "power3.out",
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.12,
  delay = 0,
  className = "",
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { clearProps: "all", visibility: "visible" });
      return undefined;
    }

    let scroller = container || document.getElementById("snap-main-container") || null;
    if (typeof scroller === "string") scroller = document.querySelector(scroller);
    const axis = direction === "horizontal" ? "x" : "y";
    const start = (1 - threshold) * 100;
    const tween = gsap.fromTo(
      element,
      {
        [axis]: reverse ? -distance : distance,
        scale,
        opacity: animateOpacity ? initialOpacity : 1,
        visibility: "visible",
      },
      {
        [axis]: 0,
        scale: 1,
        opacity: 1,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: element,
          ...(scroller ? { scroller } : {}),
          start: `top ${start}%`,
          once: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [container, distance, direction, reverse, duration, ease, initialOpacity, animateOpacity, scale, threshold, delay]);

  return (
    <div ref={ref} className={className} style={{ visibility: "hidden" }} {...props}>
      {children}
    </div>
  );
}

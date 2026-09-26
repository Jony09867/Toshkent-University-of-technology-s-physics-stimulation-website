import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FadeContent({
  children,
  container,
  blur = false,
  duration = 900,
  ease = "power2.out",
  delay = 0,
  threshold = 0.12,
  initialOpacity = 0,
  className = "",
  style,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { clearProps: "all" });
      return undefined;
    }

    let scroller = container || document.getElementById("snap-main-container") || null;
    if (typeof scroller === "string") scroller = document.querySelector(scroller);
    const seconds = value => (typeof value === "number" && value > 10 ? value / 1000 : value);
    const tween = gsap.fromTo(
      element,
      { autoAlpha: initialOpacity, filter: blur ? "blur(10px)" : "blur(0px)" },
      {
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: seconds(duration),
        delay: seconds(delay),
        ease,
        scrollTrigger: {
          trigger: element,
          ...(scroller ? { scroller } : {}),
          start: `top ${(1 - threshold) * 100}%`,
          once: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [container, blur, duration, ease, delay, threshold, initialOpacity]);

  return <div ref={ref} className={className} style={style} {...props}>{children}</div>;
}

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

export default function SplitText({
  text = "",
  className = "",
  delay = 36,
  duration = 0.8,
  ease = "power3.out",
  splitType = "lines",
  from = { opacity: 0, y: 30 },
  to = { opacity: 1, y: 0 },
  threshold = 0.15,
  textAlign = "left",
  tag = "p",
}) {
  const ref = useRef(null);
  const Tag = tag;

  useEffect(() => {
    let split;
    let tween;
    let cancelled = false;
    const run = async () => {
      await document.fonts?.ready;
      const element = ref.current;
      if (!element || cancelled || !text) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      split = new GSAPSplitText(element, {
        type: splitType,
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
      });
      const targets = splitType.includes("chars") ? split.chars : splitType.includes("words") ? split.words : split.lines;
      tween = gsap.fromTo(targets, from, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: element,
          start: `top ${(1 - threshold) * 100}%`,
          once: true,
        },
      });
    };
    run();
    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
    };
  }, [text, delay, duration, ease, splitType, threshold]);

  return <Tag ref={ref} className={className} style={{ textAlign }}>{text}</Tag>;
}

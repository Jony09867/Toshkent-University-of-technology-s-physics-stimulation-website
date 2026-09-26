import { memo, useMemo } from "react";
import "./GradualBlur.css";

function GradualBlur({
  position = "bottom",
  height = "7rem",
  width,
  strength = 1.5,
  divCount = 6,
  exponential = true,
  opacity = 1,
  zIndex = 3,
  className = "",
}) {
  const layers = useMemo(() => Array.from({ length: divCount }, (_, index) => {
    const start = (index / divCount) * 100;
    const end = ((index + 1) / divCount) * 100;
    const progress = (index + 1) / divCount;
    const amount = exponential ? Math.pow(progress, 2) * strength : progress * strength;
    const direction = { top: "to top", bottom: "to bottom", left: "to left", right: "to right" }[position];
    return {
      backdropFilter: `blur(${amount.toFixed(2)}rem)`,
      WebkitBackdropFilter: `blur(${amount.toFixed(2)}rem)`,
      maskImage: `linear-gradient(${direction}, transparent ${Math.max(0, start - 16)}%, #000 ${start}%, #000 ${end}%, transparent ${Math.min(100, end + 16)}%)`,
      WebkitMaskImage: `linear-gradient(${direction}, transparent ${Math.max(0, start - 16)}%, #000 ${start}%, #000 ${end}%, transparent ${Math.min(100, end + 16)}%)`,
      opacity,
    };
  }), [divCount, exponential, opacity, position, strength]);

  const vertical = position === "top" || position === "bottom";
  const style = {
    [position]: 0,
    height: vertical ? height : "100%",
    width: vertical ? width || "100%" : width || height,
    zIndex,
  };

  return <div className={`gradual-blur ${className}`.trim()} style={style} aria-hidden="true">{layers.map((layer, index) => <i key={index} style={layer} />)}</div>;
}

export default memo(GradualBlur);

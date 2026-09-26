import "./GlareHover.css";

export default function GlareHover({
  children,
  glareColor = "#f1592a",
  glareOpacity = 0.1,
  glareAngle = -35,
  glareSize = 220,
  transitionDuration = 900,
  className = "",
  style = {},
}) {
  const hex = glareColor.replace("#", "");
  const channels = hex.length === 3
    ? [...hex].map(value => parseInt(value + value, 16))
    : [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  const rgba = channels.every(Number.isFinite)
    ? `rgba(${channels.join(",")},${glareOpacity})`
    : glareColor;

  return (
    <div
      className={`glare-hover ${className}`.trim()}
      style={{
        "--gh-angle": `${glareAngle}deg`,
        "--gh-duration": `${transitionDuration}ms`,
        "--gh-size": `${glareSize}%`,
        "--gh-rgba": rgba,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

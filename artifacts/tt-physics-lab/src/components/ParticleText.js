const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOutCubic = (value) => 1 - (1 - value) ** 3;

export function mountParticleText(container, options = {}) {
  if (!container) return () => {};
  const {
    text = "FIZIKA",
    color = "#cfd4d8",
    highlightColor = "#f1592a",
    density = 5,
    particleSize = 1.7,
    scatter = 125,
    duration = 1350,
  } = options;
  const canvas = document.createElement("canvas"),
    accessible = document.createElement("span"),
    ctx = canvas.getContext("2d"),
    reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  canvas.className = "particle-text-canvas";
  canvas.setAttribute("aria-hidden", "true");
  accessible.className = "particle-text-sr";
  accessible.textContent = text;
  container.replaceChildren(canvas, accessible);
  if (!ctx) return () => {};

  let particles = [],
    width = 0,
    height = 0,
    frame = 0,
    resizeFrame = 0,
    start = performance.now(),
    disposed = false;
  const pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0 };

  const hex = (value) => {
    const clean = value.replace("#", "");
    return clean.length === 6
      ? [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16))
      : [241, 89, 42];
  };
  const base = hex(color),
    accent = hex(highlightColor),
    mix = (amount) =>
      `rgb(${base.map((channel, index) => Math.round(channel + (accent[index] - channel) * amount)).join(",")})`;

  const build = async () => {
    if (disposed) return;
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    await document.fonts?.ready;
    if (disposed) return;

    const fontSize = clamp(width * 0.205, 62, 142),
      offscreen = document.createElement("canvas"),
      offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;
    const font = `800 ${fontSize}px Inter, Arial, sans-serif`;
    offCtx.font = font;
    const metrics = offCtx.measureText(text),
      padding = Math.ceil(fontSize * 0.12),
      textWidth = Math.ceil(metrics.width),
      textHeight = Math.ceil(fontSize * 1.15);
    offscreen.width = textWidth + padding * 2;
    offscreen.height = textHeight + padding * 2;
    offCtx.font = font;
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillStyle = "#fff";
    offCtx.fillText(text, offscreen.width / 2, offscreen.height / 2);
    const data = offCtx.getImageData(0, 0, offscreen.width, offscreen.height).data,
      targets = [];
    for (let y = 0; y < offscreen.height; y += density)
      for (let x = 0; x < offscreen.width; x += density)
        if (data[(y * offscreen.width + x) * 4 + 3] > 80)
          targets.push({
            x: width / 2 - offscreen.width / 2 + x,
            y: height / 2 - offscreen.height / 2 + y,
          });

    const stride = Math.max(1, Math.ceil(targets.length / 2600));
    particles = targets.filter((_, index) => index % stride === 0).map((target, index) => {
      const seed = ((index * 9301 + 49297) % 233280) / 233280,
        angle = seed * Math.PI * 2,
        distance = reducedMotion.matches ? 0 : scatter * (0.45 + seed * 0.65),
        accentMix = clamp(target.x / width + (seed - 0.5) * 0.35, 0, 1);
      return {
        x: target.x + Math.cos(angle) * distance,
        y: target.y + Math.sin(angle) * distance,
        startX: target.x + Math.cos(angle) * distance,
        startY: target.y + Math.sin(angle) * distance,
        targetX: target.x,
        targetY: target.y,
        seed,
        color: mix(accentMix),
        size: particleSize * (0.75 + seed * 0.55),
      };
    });
    pointer.x = pointer.smoothX = width / 2;
    pointer.y = pointer.smoothY = height / 2;
    start = performance.now();
  };

  const render = (now) => {
    if (disposed) return;
    ctx.clearRect(0, 0, width, height);
    pointer.smoothX += (pointer.x - pointer.smoothX) * 0.16;
    pointer.smoothY += (pointer.y - pointer.smoothY) * 0.16;
    for (const particle of particles) {
      const progress = reducedMotion.matches
          ? 1
          : clamp((now - start - particle.seed * 260) / duration, 0, 1),
        eased = easeOutCubic(progress);
      let x = particle.startX + (particle.targetX - particle.startX) * eased,
        y = particle.startY + (particle.targetY - particle.startY) * eased;
      if (!reducedMotion.matches && progress === 1) {
        x += Math.sin(now * 0.0007 + particle.seed * 9) * 0.55;
        y += Math.cos(now * 0.0006 + particle.seed * 8) * 0.55;
      }
      if (pointer.active && !reducedMotion.matches) {
        const dx = x - pointer.smoothX,
          dy = y - pointer.smoothY,
          distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 105) {
          const force = (1 - distance / 105) ** 2 * 24;
          x += (dx / distance) * force;
          y += (dy / distance) * force;
        }
      }
      particle.x += (x - particle.x) * (reducedMotion.matches ? 1 : 0.2);
      particle.y += (y - particle.y) * (reducedMotion.matches ? 1 : 0.2);
      ctx.globalAlpha = 0.42 + progress * 0.58;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(render);
  };
  const move = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  };
  const leave = () => (pointer.active = false);
  const replay = () => {
    for (const particle of particles) {
      const angle = particle.seed * Math.PI * 2,
        distance = scatter * (0.45 + particle.seed * 0.65);
      particle.startX = particle.x = particle.targetX + Math.cos(angle) * distance;
      particle.startY = particle.y = particle.targetY + Math.sin(angle) * distance;
    }
    start = performance.now();
  };
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(build);
  });
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("pointerenter", replay);
  reducedMotion.addEventListener?.("change", build);
  resize.observe(container);
  build();
  frame = requestAnimationFrame(render);

  return () => {
    disposed = true;
    resize.disconnect();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(resizeFrame);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("pointerenter", replay);
    reducedMotion.removeEventListener?.("change", build);
  };
}

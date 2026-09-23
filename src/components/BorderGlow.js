// Framework-free adaptation of the user-supplied React Bits BorderGlow interaction.
// One animation frame per pointer update; no idle animation or physics-loop changes.
export function mountBorderGlow(root) {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const listeners = new AbortController();
  const disposers = [];

  for (const card of root.querySelectorAll(".hero-experiment, .sim-card")) {
    card.classList.add("border-glow");
    const layers = ["ring", "halo"].map((name) => {
      const layer = document.createElement("span");
      layer.className = `border-glow-${name}`;
      layer.setAttribute("aria-hidden", "true");
      card.append(layer);
      return layer;
    });
    let frame = 0;
    let point;
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      card.style.removeProperty("--border-glow-strength");
    };
    const paint = () => {
      frame = 0;
      const rect = card.getBoundingClientRect();
      const cx = card.offsetWidth / 2,
        cy = card.offsetHeight / 2;
      if (!cx || !cy) return;
      const dx = point.x - (rect.left + rect.width / 2);
      const dy = point.y - (rect.top + rect.height / 2);
      // Invert the card's rotation/scale, including the tilted hero panel.
      const transform = getComputedStyle(card).transform;
      const m = new DOMMatrixReadOnly(
        transform === "none" ? undefined : transform,
      );
      const determinant = m.a * m.d - m.b * m.c;
      if (!determinant) return;
      const x = (m.d * dx - m.c * dy) / determinant;
      const y = (-m.b * dx + m.a * dy) / determinant;
      const edge = Math.min(1, Math.max(Math.abs(x / cx), Math.abs(y / cy)));
      // Start the interactive glow sooner; the CSS keeps a gentle idle border.
      const strength = Math.max(0, (edge - 0.3) / 0.7);
      const angle = ((Math.atan2(y, x) * 180) / Math.PI + 450) % 360;
      card.style.setProperty("--border-glow-strength", strength.toFixed(3));
      card.style.setProperty("--border-glow-angle", `${angle.toFixed(2)}deg`);
    };
    card.addEventListener(
      "pointermove",
      (event) => {
        if (
          event.pointerType === "touch" ||
          !finePointer.matches ||
          reducedMotion.matches
        ) {
          clear();
          return;
        }
        point = { x: event.clientX, y: event.clientY };
        if (!frame) frame = requestAnimationFrame(paint);
      },
      { passive: true, signal: listeners.signal },
    );
    for (const event of ["pointerleave", "pointercancel"]) {
      card.addEventListener(event, clear, { signal: listeners.signal });
    }
    finePointer.addEventListener("change", clear, { signal: listeners.signal });
    reducedMotion.addEventListener("change", clear, {
      signal: listeners.signal,
    });
    disposers.push(() => {
      clear();
      layers.forEach((layer) => layer.remove());
      card.classList.remove("border-glow");
      card.style.removeProperty("--border-glow-angle");
    });
  }
  return () => {
    listeners.abort();
    disposers.forEach((dispose) => dispose());
  };
}

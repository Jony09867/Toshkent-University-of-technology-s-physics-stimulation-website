import { Color, Mesh, Program, Renderer, Triangle, Vec2 } from "ogl";

const vertex = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uInfluence;
  uniform vec3 uOrange;
  uniform vec3 uWarm;
  varying vec2 vUv;

  mat2 rotate2d(float angle) {
    float c = cos(angle), s = sin(angle);
    return mat2(c, -s, s, c);
  }

  float trace(float distanceToLine) {
    float core = smoothstep(0.011, 0.0015, distanceToLine);
    float halo = smoothstep(0.09, 0.0, distanceToLine) * 0.12;
    return core + halo;
  }

  float pointerBend(vec2 point) {
    vec2 mouse = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
    vec2 delta = point - mouse;
    return delta.y * exp(-dot(delta, delta) * 5.5) * uInfluence * -0.48;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = (vUv - 0.5) * vec2(aspect, 1.0);
    float time = uTime * 0.34;
    vec3 color = vec3(0.0);
    float bend = pointerBend(uv);

    vec2 top = rotate2d(-0.31) * uv;
    for (int i = 0; i < 10; i++) {
      float fi = float(i);
      float curve = 0.30 - fi * 0.028 + sin(top.x * 2.1 + time + fi * 0.17) * (0.105 + fi * 0.002);
      float energy = trace(abs(top.y - curve - bend));
      color += mix(uWarm, uOrange, fi / 9.0) * energy * (0.28 + fi * 0.015);
    }

    vec2 middle = rotate2d(0.23) * uv;
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      float curve = -0.03 - fi * 0.021 + sin(middle.x * 1.8 - time * 0.78 + fi * 0.14) * 0.125;
      float energy = trace(abs(middle.y - curve - bend * 0.72));
      color += mix(uOrange, uWarm, fi / 11.0) * energy * 0.22;
    }

    vec2 bottom = rotate2d(-0.62) * uv;
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float curve = -0.32 + fi * 0.033 + sin(bottom.x * 2.45 + time * 0.52 + fi * 0.2) * 0.09;
      float energy = trace(abs(bottom.y - curve - bend * 0.5));
      color += mix(uOrange, uWarm, fi / 7.0) * energy * 0.17;
    }

    float peak = max(color.r, max(color.g, color.b));
    float alpha = smoothstep(0.015, 0.9, peak) * 0.9;
    gl_FragColor = vec4(color, alpha);
  }
`;

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function mountFloatingLines(container, options = {}) {
  if (!container) return () => {};
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if (!canUseWebGL()) {
    container.classList.add("floating-lines-fallback");
    return () => container.classList.remove("floating-lines-fallback");
  }

  let renderer;
  try {
    renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(devicePixelRatio || 1, 1.6) });
  } catch {
    container.classList.add("floating-lines-fallback");
    return () => container.classList.remove("floating-lines-fallback");
  }

  const gl = renderer.gl;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.clearColor(0, 0, 0, 0);
  gl.canvas.setAttribute("aria-hidden", "true");
  container.appendChild(gl.canvas);

  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new Vec2(1, 1) },
      uMouse: { value: new Vec2(0.5, 0.5) },
      uInfluence: { value: 0 },
      uOrange: { value: new Color(options.orange || "#f1592a") },
      uWarm: { value: new Color(options.warm || "#fff5ef") },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const targetMouse = new Vec2(0.5, 0.5),
    currentMouse = new Vec2(0.5, 0.5),
    pointerSurface = container.parentElement || container;
  let targetInfluence = 0,
    currentInfluence = 0,
    frame = 0,
    start = performance.now();

  const resize = () => {
    const width = Math.max(1, container.clientWidth),
      height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height);
    program.uniforms.uResolution.value.set(gl.canvas.width, gl.canvas.height);
  };
  const move = (event) => {
    const rect = container.getBoundingClientRect();
    targetMouse.set(
      (event.clientX - rect.left) / Math.max(rect.width, 1),
      1 - (event.clientY - rect.top) / Math.max(rect.height, 1),
    );
    targetInfluence = 1;
  };
  const leave = () => (targetInfluence = 0);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  pointerSurface.addEventListener("pointermove", move);
  pointerSurface.addEventListener("pointerleave", leave);
  resize();

  const render = (now) => {
    const damping = 0.055;
    currentMouse.x += (targetMouse.x - currentMouse.x) * damping;
    currentMouse.y += (targetMouse.y - currentMouse.y) * damping;
    currentInfluence += (targetInfluence - currentInfluence) * damping;
    program.uniforms.uMouse.value.copy(currentMouse);
    program.uniforms.uInfluence.value = currentInfluence;
    if (!reducedMotion.matches) program.uniforms.uTime.value = (now - start) * 0.001;
    renderer.render({ scene: mesh });
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    pointerSurface.removeEventListener("pointermove", move);
    pointerSurface.removeEventListener("pointerleave", leave);
    if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

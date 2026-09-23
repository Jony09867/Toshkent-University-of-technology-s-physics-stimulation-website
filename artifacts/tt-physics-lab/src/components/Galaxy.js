import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

const vertexShader = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uResolution;
  uniform float uDensity;
  uniform float uHueShift;
  uniform float uSpeed;
  uniform float uGlowIntensity;
  uniform float uSaturation;
  uniform float uTwinkleIntensity;
  uniform float uRotationSpeed;

  varying vec2 vUv;

  #define LAYERS 4.0
  #define PI 3.14159265359

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float triangleWave(float x) {
    return abs(fract(x) * 2.0 - 1.0);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
    return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
  }

  float star(vec2 point, float flare) {
    float distanceToCenter = max(length(point), 0.002);
    float brightness = (0.045 * uGlowIntensity) / distanceToCenter;
    float rays = smoothstep(0.0, 1.0, 1.0 - abs(point.x * point.y * 900.0));
    brightness += rays * flare * uGlowIntensity;
    return brightness * smoothstep(1.0, 0.12, distanceToCenter);
  }

  void main() {
    vec2 centered = (vUv * uResolution.xy - 0.5 * uResolution.xy) / uResolution.y;
    float angle = uTime * uRotationSpeed;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    centered = rotation * centered;

    vec3 color = vec3(0.0);

    for (float layer = 0.0; layer < LAYERS; layer += 1.0) {
      float depth = fract(layer / LAYERS + uTime * uSpeed * 0.035);
      float scale = mix(18.0 * uDensity, 0.7 * uDensity, depth);
      float fade = depth * smoothstep(1.0, 0.82, depth);
      vec2 space = centered * scale + layer * 91.73;
      vec2 cell = fract(space) - 0.5;
      vec2 id = floor(space);

      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 offset = vec2(float(x), float(y));
          vec2 seedCell = id + offset;
          float seed = hash21(seedCell);
          float size = fract(seed * 345.32);
          float flare = smoothstep(0.88, 1.0, size) * triangleWave(seed * 34.0 + uTime);
          vec2 drift = vec2(
            triangleWave(seed * 34.0 + uTime * uSpeed / 10.0),
            triangleWave(seed * 38.0 + uTime * uSpeed / 30.0)
          ) - 0.5;
          float brightness = star(cell - offset - drift * 0.1, flare);

          float hue = fract(0.06 + uHueShift / 360.0 + hash21(seedCell + 2.0) * 0.12);
          vec3 starColor = hsv2rgb(vec3(hue, 0.55, 1.0));
          float twinkle = triangleWave(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
          twinkle = mix(1.0, twinkle, uTwinkleIntensity);
          color += brightness * size * fade * twinkle * starColor;
        }
      }
    }

    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luminance), color, uSaturation);
    float alpha = smoothstep(0.0, 0.24, length(color));
    gl_FragColor = vec4(color, alpha);
  }
`;

const defaults = {
  density: 0.72,
  hueShift: 18,
  speed: 0.55,
  glowIntensity: 0.24,
  saturation: 0.55,
  twinkleIntensity: 0.38,
  rotationSpeed: 0.025,
  disableAnimation: false,
};

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

export function mountGalaxy(container, options = {}) {
  if (!container) return () => {};

  const settings = { ...defaults, ...options };
  if (!supportsWebGL()) {
    container.classList.add("galaxy-fallback");
    return () => container.classList.remove("galaxy-fallback");
  }

  let renderer;
  try {
    renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    });
  } catch {
    container.classList.add("galaxy-fallback");
    return () => container.classList.remove("galaxy-fallback");
  }
  const gl = renderer.gl;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  gl.canvas.setAttribute("aria-hidden", "true");
  gl.canvas.style.display = "block";
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  container.appendChild(gl.canvas);

  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uResolution: {
        value: new Color(1, 1, 1),
      },
      uDensity: { value: settings.density },
      uHueShift: { value: settings.hueShift },
      uSpeed: { value: settings.speed },
      uGlowIntensity: { value: settings.glowIntensity },
      uSaturation: { value: settings.saturation },
      uTwinkleIntensity: { value: settings.twinkleIntensity },
      uRotationSpeed: { value: settings.rotationSpeed },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const resize = () => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height);
    program.uniforms.uResolution.value = new Color(
      gl.canvas.width,
      gl.canvas.height,
      gl.canvas.width / gl.canvas.height,
    );
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let frame = 0;
  let start = performance.now();
  const render = (now) => {
    if (!settings.disableAnimation) {
      program.uniforms.uTime.value = (now - start) * 0.001;
    }
    renderer.render({ scene: mesh });
    if (!settings.disableAnimation) frame = requestAnimationFrame(render);
  };
  if (settings.disableAnimation) render(0);
  else frame = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
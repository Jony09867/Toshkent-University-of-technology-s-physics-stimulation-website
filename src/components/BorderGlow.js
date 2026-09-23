// BorderGlow.js — Vanilla JS adaptation of React Bits BorderGlow
function parseHSL(hslStr) {
  const match = String(hslStr).match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 14, s: 88, l: 55 }; // Default TT Orange hue
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
  const vars = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors) {
  const vars = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function isLightColor(color) {
  const value = String(color).trim().replace('#', '');
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return false;
  const hex = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
}

function getCenterOfElement(el) {
  const rect = el.getBoundingClientRect();
  return [rect.width / 2, rect.height / 2];
}

function getEdgeProximity(el, x, y) {
  const [cx, cy] = getCenterOfElement(el);
  const dx = x - cx;
  const dy = y - cy;
  let kx = Infinity;
  let ky = Infinity;
  if (dx !== 0) kx = cx / Math.abs(dx);
  if (dy !== 0) ky = cy / Math.abs(dy);
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
}

function getCursorAngle(el, x, y) {
  const [cx, cy] = getCenterOfElement(el);
  const dx = x - cx;
  const dy = y - cy;
  if (dx === 0 && dy === 0) return 0;
  const radians = Math.atan2(dy, dx);
  let degrees = radians * (180 / Math.PI) + 90;
  if (degrees < 0) degrees += 360;
  return degrees;
}

export function attachBorderGlow(cardEl, options = {}) {
  if (!cardEl) return;

  const {
    edgeSensitivity = 30,
    glowColor = "14 88 55",
    backgroundColor = "#ffffff",
    borderRadius = 20,
    glowRadius = 35,
    glowIntensity = 1.0,
    coneSpread = 25,
    colors = ['#F1592A', '#3883d9', '#19a378'],
    fillOpacity = 0.35,
  } = options;

  cardEl.classList.add('border-glow-card');
  if (isLightColor(backgroundColor)) {
    cardEl.classList.add('border-glow-card--light');
  }

  const styleVars = {
    '--card-bg': backgroundColor,
    '--edge-sensitivity': edgeSensitivity,
    '--border-radius': `${borderRadius}px`,
    '--glow-padding': `${glowRadius}px`,
    '--cone-spread': coneSpread,
    '--fill-opacity': fillOpacity,
    ...buildGlowVars(glowColor, glowIntensity),
    ...buildGradientVars(colors),
  };

  for (const [k, v] of Object.entries(styleVars)) {
    cardEl.style.setProperty(k, v);
  }

  if (!cardEl.querySelector('.edge-light')) {
    const lightSpan = document.createElement('span');
    lightSpan.className = 'edge-light';
    cardEl.appendChild(lightSpan);
  }

  const handlePointerMove = (e) => {
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = getEdgeProximity(cardEl, x, y);
    const angle = getCursorAngle(cardEl, x, y);

    cardEl.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    cardEl.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  };

  cardEl.addEventListener('pointermove', handlePointerMove);
  return () => cardEl.removeEventListener('pointermove', handlePointerMove);
}

export function renderBorderGlowCard(contentHtml, options = {}) {
  const {
    className = '',
    edgeSensitivity = 30,
    glowColor = "14 88 55",
    backgroundColor = "#ffffff",
    borderRadius = 20,
    glowRadius = 35,
    glowIntensity = 1.0,
    coneSpread = 25,
    colors = ['#F1592A', '#3883d9', '#19a378'],
    fillOpacity = 0.35,
  } = options;

  const lightSurface = isLightColor(backgroundColor);
  const glowVars = buildGlowVars(glowColor, glowIntensity);
  const gradientVars = buildGradientVars(colors);

  const styleAttr = [
    `--card-bg: ${backgroundColor}`,
    `--edge-sensitivity: ${edgeSensitivity}`,
    `--border-radius: ${borderRadius}px`,
    `--glow-padding: ${glowRadius}px`,
    `--cone-spread: ${coneSpread}`,
    `--fill-opacity: ${fillOpacity}`,
    ...Object.entries(glowVars).map(([k, v]) => `${k}: ${v}`),
    ...Object.entries(gradientVars).map(([k, v]) => `${k}: ${v}`),
  ].join('; ');

  return `
    <div class="border-glow-card${lightSurface ? ' border-glow-card--light' : ''} ${className}" style="${styleAttr}">
      <span class="edge-light"></span>
      <div class="border-glow-inner">
        ${contentHtml}
      </div>
    </div>
  `;
}

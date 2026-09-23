export function formula(tex, display = false) {
  if (globalThis.katex)
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode: display,
      strict: false,
    });
  return `<span class="formula-fallback">${tex.replaceAll("<", "&lt;")}</span>`;
}

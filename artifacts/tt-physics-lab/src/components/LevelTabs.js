import { uz } from "../i18n/uz.js";
export const levelTabs = (level) =>
  `<div class="level-tabs" role="tablist" aria-label="${uz.levelLabel}">${uz.levels.map((name, i) => `<button id="level-${i}" role="tab" aria-controls="experiment-panel" aria-selected="${level === i}" tabindex="${level === i ? 0 : -1}" class="level-tab ${level === i ? "selected" : ""}" data-level="${i}"><span class="level-dot l${i}"></span>${name}<span class="level-hint">${uz.levelHints[i]}</span></button>`).join("")}</div>`;

import { DEFAULT_LANGUAGE, DEFAULT_SLIDER_VALUE, PANEL_KEYS } from "./js/config.js";
import { createTranslator, loadMessages, normalizeLanguageCode, resolveLanguage } from "./js/i18n.js";
import { createModel } from "./js/model.js";
import { createModalController } from "./js/modals.js";
import { createRenderer } from "./js/render.js";
import { createSimulation } from "./js/simulation.js";

const elements = {
  appShell: document.querySelector(".app-shell"),
  diseaseGrid: document.getElementById("diseaseGrid"),
  vaccineGrid: document.getElementById("vaccineGrid"),
  diseaseResult: document.getElementById("diseaseResult"),
  vaccineResult: document.getElementById("vaccineResult"),
  diseaseSummary: document.getElementById("diseaseSummary"),
  vaccineSummary: document.getElementById("vaccineSummary"),
  diseaseLegend: document.getElementById("diseaseLegend"),
  vaccineLegend: document.getElementById("vaccineLegend"),
  diseaseRare: document.getElementById("diseaseRare"),
  vaccineRare: document.getElementById("vaccineRare"),
  diseaseSelect: document.getElementById("diseaseSelect"),
  languageSelect: document.getElementById("languageSelect"),
  slider: document.getElementById("vaccinationSlider"),
  sliderValue: document.getElementById("sliderValue"),
  communityTitle: document.getElementById("communityTitle"),
  vaccineHeading: document.getElementById("vaccineHeading"),
  diseaseHeading: document.getElementById("diseaseHeading"),
  testButton: document.getElementById("testButton"),
  dice: document.querySelector(".dice"),
  aboutButton: document.getElementById("aboutButton"),
  aboutClose: document.getElementById("aboutClose"),
  aboutOverlay: document.getElementById("aboutOverlay"),
  aboutPanel: document.getElementById("aboutPanel"),
  aboutTitle: document.getElementById("aboutTitle"),
  sourcesButton: document.getElementById("sourcesButton"),
  sourcesClose: document.getElementById("sourcesClose"),
  sourcesOverlay: document.getElementById("sourcesOverlay"),
  sourcesPanel: document.getElementById("sourcesPanel"),
  sourcesTitle: document.getElementById("sourcesTitle"),
  sourcesContent: document.getElementById("sourcesContent"),
  infoButton: document.getElementById("infoButton"),
  infoClose: document.getElementById("infoClose"),
  infoOverlay: document.getElementById("infoOverlay"),
  infoPanel: document.getElementById("infoPanel"),
  infoTitle: document.getElementById("infoTitle"),
  infoContent: document.getElementById("infoContent")
};

const views = {
  vaccine: {
    key: "vaccine",
    grid: elements.vaccineGrid,
    summary: elements.vaccineSummary,
    legend: elements.vaccineLegend,
    rare: elements.vaccineRare,
    result: elements.vaccineResult,
    cells: []
  },
  disease: {
    key: "disease",
    grid: elements.diseaseGrid,
    summary: elements.diseaseSummary,
    legend: elements.diseaseLegend,
    rare: elements.diseaseRare,
    result: elements.diseaseResult,
    cells: []
  }
};

const state = {
  lang: DEFAULT_LANGUAGE,
  messages: {
    strings: {},
    templates: {}
  },
  data: null,
  diseaseIndex: 0,
  gridEntries: {
    vaccine: [],
    disease: []
  }
};

const app = {
  elements,
  views,
  state,
  ...createTranslator(state)
};

const model = createModel(app);
const renderer = createRenderer(app, model);
const modalController = createModalController(app, renderer);
const simulation = createSimulation(app, model, renderer);
let resizeFrame = 0;

init();

async function init() {
  try {
    initializeLoadingPanels();
    state.lang = resolveLanguage();
    elements.languageSelect.value = state.lang;
    state.messages = await loadMessages(state.lang);
    renderer.applyStaticTranslations();
    state.data = await model.loadData();
    state.diseaseIndex = model.resolveDiseaseIndex(state.data.diseases);
    PANEL_KEYS.forEach(panel => renderer.createGrid(views[panel]));
    renderer.populateDiseaseSelect();
    bindEvents();

    elements.slider.value = DEFAULT_SLIDER_VALUE;
    elements.diseaseSelect.value = String(state.diseaseIndex);
    renderer.render();
    elements.appShell?.classList.add("is-ready");
  } catch (error) {
    renderer.setErrorState();
    console.error(error);
  }
}

function bindEvents() {
  bindInputModalityTracking();
  elements.slider.addEventListener("input", renderer.render);
  elements.diseaseSelect.addEventListener("change", event => {
    state.diseaseIndex = Number(event.target.value) || 0;
    renderer.resetRareEffectsState();
    updateUrlState();
    renderer.render();
  });
  elements.languageSelect.addEventListener("change", event => {
    void changeLanguage(event.target.value);
  });
  elements.testButton.addEventListener("click", () => simulation.runSimulation({ restoreFocus: true }));
  elements.dice?.addEventListener("click", () => {
    if (elements.testButton.disabled) return;
    simulation.runSimulation({ restoreFocus: false });
  });
  PANEL_KEYS.forEach(panel => {
    views[panel].grid.addEventListener("click", event => simulation.handleGridClick(event, panel));
    views[panel].grid.addEventListener("keydown", event => simulation.handleGridKeydown(event, panel));
  });
  modalController.bindModalEvents();
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (modalController.hasOpenModal()) {
      modalController.closeAllModals();
      return;
    }
    if (renderer.hasVisibleResultPopup()) {
      renderer.clearResultPopups();
      simulation.clearCellEffects();
      return;
    }
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".result")) return;
    renderer.clearResultPopups();
  });
  window.addEventListener("resize", scheduleResizeRender, { passive: true });
}

async function changeLanguage(lang) {
  const nextLanguage = normalizeLanguageCode(lang) || DEFAULT_LANGUAGE;
  if (nextLanguage === state.lang) return;

  state.messages = await loadMessages(nextLanguage);
  state.lang = nextLanguage;
  updateUrlState();
  renderer.populateDiseaseSelect();
  elements.diseaseSelect.value = String(state.diseaseIndex);
  renderer.render();
}

function updateUrlState() {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", state.lang);
  if (state.data?.diseases?.[state.diseaseIndex]) {
    url.searchParams.set("disease", state.data.diseases[state.diseaseIndex].slug);
  }
  window.history.replaceState({}, "", url);
}

function bindInputModalityTracking() {
  document.documentElement.dataset.inputModality = "pointer";

  document.addEventListener("keydown", event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const keyboardKeys = [
      "Tab",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Enter",
      " "
    ];

    if (keyboardKeys.includes(event.key)) {
      document.documentElement.dataset.inputModality = "keyboard";
    }
  }, true);

  document.addEventListener("pointerdown", () => {
    document.documentElement.dataset.inputModality = "pointer";
  }, true);
}

function scheduleResizeRender() {
  if (!state.data) return;
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    renderer.render();
  });
}

function initializeLoadingPanels() {
  document.querySelectorAll("[data-loading-grid]").forEach(grid => {
    if (grid.dataset.initialized === "true") return;

    const cells = buildLoadingCells(createRandomWormPath());
    grid.replaceChildren(...cells);
    grid.dataset.initialized = "true";
  });
}

function buildLoadingCells(wormPath) {
  const cells = [];
  const wormIndexes = new Map(wormPath.map((index, order) => [index, order]));

  for (let index = 0; index < 100; index += 1) {
    const cell = document.createElement("span");
    cell.className = "loading-cell";

    if (wormIndexes.has(index)) {
      cell.classList.add("is-worm");
      cell.style.setProperty("--worm-order", String(wormIndexes.get(index)));
    }

    cells.push(cell);
  }

  return cells;
}

function createRandomWormPath(length = 11, size = 10) {
  const start = Math.floor(Math.random() * size * size);
  const path = [start];
  const visited = new Set(path);
  let current = start;

  while (path.length < length) {
    const neighbors = getLoadingNeighbors(current, size).filter(index => !visited.has(index));

    if (neighbors.length) {
      current = neighbors[Math.floor(Math.random() * neighbors.length)];
      path.push(current);
      visited.add(current);
      continue;
    }

    const branches = path.filter(index =>
      getLoadingNeighbors(index, size).some(neighbor => !visited.has(neighbor))
    );

    if (!branches.length) break;
    current = branches[Math.floor(Math.random() * branches.length)];
  }

  return path;
}

function getLoadingNeighbors(index, size) {
  const row = Math.floor(index / size);
  const col = index % size;
  const neighbors = [];

  if (col > 0) neighbors.push(index - 1);
  if (col < size - 1) neighbors.push(index + 1);
  if (row > 0) neighbors.push(index - size);
  if (row < size - 1) neighbors.push(index + size);

  return neighbors;
}

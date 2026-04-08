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

init();

async function init() {
  try {
    state.lang = resolveLanguage();
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
  elements.testButton.addEventListener("click", simulation.runSimulation);
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

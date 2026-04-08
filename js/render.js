import {
  CELL_COUNT,
  GRID_SIZE,
  PANEL_KEYS,
  PERCENT_SCALE,
  PROBABILITY_BASIS,
  RESULT_FALLBACK_KEYS,
  SLIDER_POSITION_PROPERTY
} from "./config.js";

export function createRenderer(app, model) {
  const { elements, views, state, t, tf } = app;

  function createGrid(view) {
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < CELL_COUNT; index += 1) {
      fragment.appendChild(createCell(view, index));
    }

    view.grid.tabIndex = 0;
    view.grid.setAttribute("role", "grid");
    view.grid.setAttribute("aria-rowcount", String(GRID_SIZE));
    view.grid.setAttribute("aria-colcount", String(GRID_SIZE));
    view.grid.appendChild(fragment);
    view.cells = Array.from(view.grid.children);
    view.activeIndex = 0;
    syncGridFocusState(view);
  }

  function createCell(view, index) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.id = `${view.key}-cell-${index}`;
    cell.dataset.index = String(index);
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-rowindex", String(Math.floor(index / GRID_SIZE) + 1));
    cell.setAttribute("aria-colindex", String((index % GRID_SIZE) + 1));
    return cell;
  }

  function populateDiseaseSelect() {
    const categories = groupDiseasesByCategory();
    const fragment = document.createDocumentFragment();

    categories.forEach((diseases, category) => {
      const group = document.createElement("optgroup");
      group.label = t(category);

      diseases.forEach(({ disease, index }) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = t(disease.name);
        group.appendChild(option);
      });

      fragment.appendChild(group);
    });

    elements.diseaseSelect.replaceChildren(fragment);
  }

  function groupDiseasesByCategory() {
    return state.data.diseases.reduce((grouped, disease, index) => {
      const group = grouped.get(disease.category) || [];
      group.push({ disease, index });
      grouped.set(disease.category, group);
      return grouped;
    }, new Map());
  }

  function render(options = {}) {
    const renderOptions = normalizeRenderOptions(options);
    renderContent(renderOptions);
  }

  function normalizeRenderOptions(options) {
    if (!options || typeof options !== "object" || "target" in options) {
      return {};
    }

    return options;
  }

  function renderContent(options = {}) {
    applyStaticTranslations();
    const disease = model.getCurrentDisease();
    const vaccine = disease.vaccine;
    const vaccinationRate = model.getVaccinationRate();
    const infectionRisk = model.getInfectionRisk(disease, vaccinationRate);
    const diseaseLegendOutcomes = model.mapDisplayProbability(disease.outcomes, infectionRisk);

    clearResultPopups();
    elements.sliderValue.textContent = `${Math.round(vaccinationRate * PERCENT_SCALE)}%`;
    views.vaccine.summary.textContent = tf("summary.vaccine", {
      count: Math.round(model.getTotalProbability(vaccine.outcomes) * PERCENT_SCALE)
    });
    views.disease.summary.textContent = tf("summary.disease", {
      count: Math.round(infectionRisk * PERCENT_SCALE)
    });

    setSliderPosition(Number(elements.slider.value));
    state.gridEntries.vaccine = model.buildAbsoluteGridDistribution(vaccine.outcomes);
    state.gridEntries.disease = model.buildConditionalGridDistribution(infectionRisk, disease.outcomes, disease.long_term_effects);

    paintGrid(views.vaccine, state.gridEntries.vaccine);
    paintGrid(views.disease, state.gridEntries.disease);
    renderPanelLegend(views.vaccine, vaccine.outcomes, state.gridEntries.vaccine, PROBABILITY_BASIS.vaccine);
    renderPanelLegend(views.disease, diseaseLegendOutcomes, state.gridEntries.disease, PROBABILITY_BASIS.disease);
    options.afterRender?.();
  }

  function paintGrid(view, distribution) {
    view.cells.forEach((cell, index) => {
      const entry = distribution[index];
      cell.className = entry?.className || "cell";
      cell.setAttribute("aria-label", getCellAriaLabel(view, entry?.outcome || null));
    });
    syncGridFocusState(view);
  }

  function getCellAriaLabel(view, outcome) {
    const fallback = t(RESULT_FALLBACK_KEYS[view.key]);
    if (!outcome) return fallback;

    const label = outcome.isRare && !outcome.secondaryTitle
      ? `${t("Rare effect:")} ${t(outcome.label)}`
      : t(outcome.label);
    const description = outcome.description ? t(outcome.description) : "";
    return description ? `${label}. ${description}` : label;
  }

  function renderPanelLegend(view, primaryOutcomes, gridEntries, probabilityBasis) {
    const { commonOutcomes, rareOutcomes } = model.splitOutcomesByVisibility(primaryOutcomes, gridEntries);
    view.legend.replaceChildren(createLegendFragment(commonOutcomes));
    renderRareEffects(view.rare, rareOutcomes, probabilityBasis);
  }

  function createLegendFragment(outcomes) {
    const fragment = document.createDocumentFragment();

    outcomes.forEach(outcome => {
      const item = document.createElement("span");
      item.className = "legend-item";

      const swatch = document.createElement("i");
      swatch.className = `swatch ${model.normalizeSeverity(outcome)}`;

      item.append(swatch, document.createTextNode(t(outcome.label)));
      fragment.appendChild(item);
    });

    return fragment;
  }

  function renderRareEffects(container, outcomes, probabilityBasis) {
    if (!outcomes.length) {
      container.removeAttribute("open");
      container.replaceChildren();
      container.hidden = true;
      delete container.dataset.initialized;
      delete container._summary;
      delete container._body;
      delete container._list;
      return;
    }

    container.hidden = false;
    ensureRareEffectsStructure(container);
    container._summary.textContent = t("Rare effects");
    container._list.replaceChildren(createRareEffectsFragment(outcomes, probabilityBasis));
    syncRareEffectsHeight(container, container._body, false);
  }

  function ensureRareEffectsStructure(container) {
    if (container.dataset.initialized === "true") return;

    const summary = document.createElement("summary");
    const body = document.createElement("div");
    const list = document.createElement("ul");

    summary.tabIndex = 0;
    body.className = "rare-effects-body";
    body.appendChild(list);
    container.replaceChildren(summary, body);
    container.dataset.initialized = "true";
    container._summary = summary;
    container._body = body;
    container._list = list;
    setupRareEffectsTransition(container);
  }

  function createRareEffectsFragment(outcomes, probabilityBasis) {
    const fragment = document.createDocumentFragment();

    outcomes.forEach(outcome => {
      const item = document.createElement("li");
      const label = document.createElement("strong");
      const probability = document.createElement("span");

      label.textContent = t(outcome.label);
      probability.textContent = model.formatProbability(model.getDisplayProbability(outcome), probabilityBasis);
      item.append(label, probability);
      fragment.appendChild(item);
    });

    return fragment;
  }

  function setupRareEffectsTransition(container) {
    syncRareEffectsHeight(container, container._body, false);
    container.ontoggle = () => {
      container.dataset.userOpen = String(container.open);
      syncRareEffectsHeight(container, container._body, true);
    };
  }

  function syncRareEffectsHeight(container, body, animate) {
    const contentHeight = `${body.scrollHeight}px`;

    if (!animate) {
      body.style.maxHeight = container.open ? contentHeight : "0px";
      return;
    }

    if (container.open) {
      body.style.maxHeight = "0px";
      requestAnimationFrame(() => {
        body.style.maxHeight = contentHeight;
      });
      return;
    }

    body.style.maxHeight = contentHeight;
    requestAnimationFrame(() => {
      body.style.maxHeight = "0px";
    });
  }

  function setResultPopup(element, text) {
    if (!text) {
      element.replaceChildren();
      element.classList.remove("is-visible");
      element.setAttribute("aria-hidden", "true");
      return;
    }

    element.replaceChildren(createResultFragment(text));
    element.classList.add("is-visible");
    element.setAttribute("aria-hidden", "false");
  }

  function createResultFragment(text) {
    const fragment = document.createDocumentFragment();

    if (text.contextLabel) {
      fragment.appendChild(createTextBlock("p", "result-context", text.contextLabel));
    }

    if (text.severity) {
      const chip = document.createElement("span");
      chip.className = `result-chip cell ${text.severity} selected`;
      chip.setAttribute("aria-hidden", "true");
      fragment.appendChild(chip);
    }

    fragment.appendChild(createTextBlock("p", "result-title", text.title));

    if (text.description) {
      fragment.appendChild(createTextBlock("p", "result-description", text.description));
    }

    if (text.secondaryTitle) {
      fragment.appendChild(createTextBlock("p", "result-secondary-title", text.secondaryTitle));
      fragment.appendChild(createTextBlock("p", "result-secondary-description", text.secondaryDescription));
    }

    return fragment;
  }

  function createTextBlock(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function clearResultPopups() {
    PANEL_KEYS.forEach(panel => setResultPopup(views[panel].result, ""));
  }

  function hasVisibleResultPopup() {
    return PANEL_KEYS.some(panel => views[panel].result.classList.contains("is-visible"));
  }

  function buildResultContent(outcome, fallback) {
    if (!outcome) {
      return {
        contextLabel: "",
        title: fallback,
        description: "",
        severity: null
      };
    }

    return {
      contextLabel: "",
      title: `${outcome.isRare && !outcome.secondaryTitle ? `${t("Rare effect:")} ` : ""}${t(outcome.label)}`,
      description: t(outcome.description),
      severity: model.normalizeSeverity(outcome),
      secondaryTitle: outcome.secondaryTitle ? t(outcome.secondaryTitle) : "",
      secondaryDescription: outcome.secondaryDescription || ""
    };
  }

  function revealPanelResult(panel, outcome) {
    setResultPopup(views[panel].result, {
      ...buildResultContent(outcome, t(RESULT_FALLBACK_KEYS[panel])),
      contextLabel: t(panel === "vaccine" ? "From one vaccination:" : "From exposure:")
    });
  }

  function setErrorState() {
    setResultPopup(views.vaccine.result, {
      contextLabel: t("From one vaccination:"),
      title: t("Data could not be loaded."),
      description: "",
      severity: null
    });
    setResultPopup(views.disease.result, {
      contextLabel: t("From exposure:"),
      title: t("Check data.json and try again."),
      description: "",
      severity: null
    });
  }

  function resetRareEffectsState() {
    PANEL_KEYS.forEach(panel => {
      const container = views[panel].rare;
      container.dataset.userOpen = "false";
      container.removeAttribute("open");
    });
  }

  function setSliderPosition(value) {
    elements.slider.style.setProperty(SLIDER_POSITION_PROPERTY, `${value}%`);
  }

  function setGridActiveCell(view, index) {
    if (!view.cells.length) return;

    const nextIndex = Math.max(0, Math.min(CELL_COUNT - 1, index));
    view.activeIndex = nextIndex;
    syncGridFocusState(view);
  }


  function syncGridFocusState(view) {
    const activeIndex = typeof view.activeIndex === "number" ? view.activeIndex : 0;
    view.grid.setAttribute("aria-activedescendant", `${view.key}-cell-${activeIndex}`);

    view.cells.forEach((cell, index) => {
      const isActive = index === activeIndex;
      cell.classList.toggle("keyboard-active", isActive);
    });
  }

  function applyStaticTranslations() {
    document.documentElement.lang = state.lang;
    document.title = t("VaxVsBug");
    elements.languageSelect.value = state.lang;
    elements.communityTitle.textContent = t("Vaccine Rate in Your Community");
    elements.vaccineHeading.textContent = t("Vaccination effects");
    elements.diseaseHeading.textContent = t("Infection effects");
    elements.testButton.textContent = t("Try your luck");
    elements.aboutButton.textContent = t("About");
    elements.aboutButton.setAttribute("aria-label", t("About"));
    elements.aboutTitle.textContent = t("About");
    elements.aboutClose.setAttribute("aria-label", t("Close about panel"));
    elements.sourcesButton.textContent = t("Sources");
    elements.sourcesButton.setAttribute("aria-label", t("Sources"));
    elements.sourcesTitle.textContent = t("Sources");
    elements.sourcesClose.setAttribute("aria-label", t("Close sources panel"));
    elements.infoTitle.textContent = t("About this app");
    renderInfoContent();
    elements.infoClose.setAttribute("aria-label", t("Close information panel"));
    renderSourcesContent();
    applyAriaTranslations();
  }

  function applyAriaTranslations() {
    elements.diseaseGrid.setAttribute("aria-label", t("Infection effects probability grid"));
    elements.vaccineGrid.setAttribute("aria-label", t("Vaccine effects probability grid"));
    elements.diseaseLegend.setAttribute("aria-label", t("Infection effects legend"));
    elements.vaccineLegend.setAttribute("aria-label", t("Vaccine effects legend"));
    elements.slider.setAttribute("aria-label", t("Vaccination rate in your community"));
    elements.diseaseSelect.setAttribute("aria-label", t("Select disease"));
    elements.languageSelect.setAttribute("aria-label", t("Language"));
    elements.infoButton.setAttribute("aria-label", t("Information"));
  }

  function renderSourcesContent() {
    if (!state.data?.diseases) return;

    const fragment = document.createDocumentFragment();

    state.data.diseases.forEach(disease => {
      fragment.appendChild(createSourcesEntry(disease));
    });

    elements.sourcesContent.replaceChildren(fragment);
  }

  function createSourcesEntry(disease) {
    const section = document.createElement("section");
    section.className = "sources-entry";

    section.append(
      createTextBlock("h3", "", t(disease.name)),
      createTextBlock("p", "sources-subhead", t("Disease sources")),
      createSourceLinksParagraph(disease.sources?.disease),
      createTextBlock("p", "sources-subhead", `${t("Vaccine sources")} · ${t(disease.vaccine.name)}`),
      createSourceLinksParagraph(disease.sources?.vaccine)
    );

    return section;
  }

  function renderInfoContent() {
    const blocks = Array.isArray(state.messages.info_content)
      ? state.messages.info_content
      : [];

    elements.infoContent.replaceChildren(
      ...blocks
        .map(createInfoBlock)
        .filter(Boolean)
    );
  }

  function createInfoBlock(block) {
    if (!block || typeof block !== "object") return null;

    if (block.type === "links" && Array.isArray(block.items)) {
      return createLinksParagraph("info-links", block.items, item => ({
        label: item.label,
        url: item.url
      }));
    }

    if (block.type === "paragraph" && block.text) {
      return createTextBlock("p", "", block.text);
    }

    return null;
  }

  function createLinksParagraph(className, items, mapItem = item => item) {
    const links = getUniqueLinks(items, mapItem);
    const paragraph = document.createElement("p");
    paragraph.className = className;

    links.forEach((link, index) => {
      if (index > 0) {
        const separator = document.createElement("span");
        separator.setAttribute("aria-hidden", "true");
        separator.textContent = " · ";
        paragraph.appendChild(separator);
      }

      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = link.label;
      paragraph.appendChild(anchor);
    });

    return paragraph;
  }

  function createSourceLinksParagraph(items) {
    return createLinksParagraph("sources-links", items, item => ({
      label: item?.institution,
      url: item?.url
    }));
  }

  function getUniqueLinks(items = [], mapItem = item => item) {
    const links = [];
    const seen = new Set();

    items.forEach(item => {
      const link = mapItem(item);
      if (!link?.label || !link?.url || seen.has(link.label)) return;
      seen.add(link.label);
      links.push(link);
    });

    return links;
  }

  return {
    applyStaticTranslations,
    buildResultContent,
    clearResultPopups,
    createGrid,
    hasVisibleResultPopup,
    paintGrid,
    populateDiseaseSelect,
    render,
    revealPanelResult,
    renderSourcesContent,
    resetRareEffectsState,
    setGridActiveCell,
    setErrorState,
    setResultPopup,
    syncGridFocusState,
    syncRareEffectsHeight
  };
}

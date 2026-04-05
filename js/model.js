import {
  CELL_COUNT,
  GRID_SIZE,
  PERCENT_SCALE,
  PROBABILITY_COUNT_THRESHOLD,
  RARE_OUTCOME_THRESHOLD,
  SLIDER_MAX
} from "./config.js";
import { clamp } from "./utils.js";

export function createModel(app) {
  const { elements, state, t, tf } = app;

  function loadData() {
    return fetch("data.json")
      .then(response => {
        if (!response.ok) throw new Error("Failed to load data");
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data.diseases) || !data.diseases.every(disease => disease.vaccine && disease.category && disease.slug)) {
          throw new Error("Unexpected data shape");
        }

        return data;
      });
  }

  function resolveDiseaseIndex(diseases) {
    const params = new URLSearchParams(window.location.search);
    const requestedSlug = params.get("disease");
    const index = diseases.findIndex(disease => disease.slug === requestedSlug);
    return index >= 0 ? index : 0;
  }

  function getCurrentDisease() {
    return state.data.diseases[state.diseaseIndex];
  }

  function getVaccinationRate() {
    return Number(elements.slider.value) / SLIDER_MAX;
  }

  function getInfectionRisk(disease, vaccinationRate) {
    return disease.environmental_hostility * (1 - vaccinationRate * disease.vaccine.effectiveness);
  }

  function getTotalProbability(outcomes = []) {
    return outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
  }

  function mapDisplayProbability(outcomes = [], multiplier = 1) {
    return outcomes.map(outcome => ({
      ...outcome,
      displayProbability: outcome.probability * multiplier
    }));
  }

  function getDisplayProbability(outcome) {
    return typeof outcome.displayProbability === "number"
      ? outcome.displayProbability
      : outcome.probability;
  }

  function normalizeSeverity(outcome) {
    switch (outcome.severity) {
      case "mild":
      case "moderate":
      case "hospitalization":
      case "fatal":
        return outcome.severity;
      case "severe":
      default:
        return "severe";
    }
  }

  function normalizeOutcomeSeverity(outcome) {
    return outcome ? normalizeSeverity(outcome) : null;
  }

  function buildAbsoluteGridDistribution(outcomes) {
    const weighted = outcomes.map(outcome => ({
      outcome,
      severity: normalizeSeverity(outcome),
      count: clamp(Math.round(outcome.probability * CELL_COUNT), 0, CELL_COUNT)
    }));
    const activeCellCount = clamp(
      weighted.reduce((sum, outcome) => sum + outcome.count, 0),
      0,
      CELL_COUNT
    );

    rebalanceWeights(weighted, activeCellCount);
    return createGridEntries(weighted);
  }

  function buildConditionalGridDistribution(totalProbability, outcomes, longTermEffects = []) {
    const activeCellCount = clamp(Math.round(totalProbability * CELL_COUNT), 0, CELL_COUNT);
    const weighted = outcomes.map(outcome => ({
      outcome: decorateDiseaseOutcome(outcome, longTermEffects),
      severity: normalizeSeverity(outcome),
      count: Math.round(activeCellCount * outcome.probability)
    }));

    rebalanceWeights(weighted, activeCellCount);
    return createGridEntries(weighted);
  }

  function createGridEntries(weighted) {
    const entries = Array.from({ length: CELL_COUNT }, () => ({
      className: "cell",
      outcome: null
    }));
    let pointer = 0;

    weighted.forEach(({ severity, count, outcome }) => {
      for (let step = 0; step < count && pointer < CELL_COUNT; step += 1, pointer += 1) {
        entries[pointer] = {
          className: `cell ${severity}`,
          outcome
        };
      }
    });

    return entries;
  }

  function rebalanceWeights(weighted, targetCount) {
    if (!weighted.length) return;
    const assigned = weighted.reduce((sum, outcome) => sum + outcome.count, 0);
    weighted[0].count += targetCount - assigned;
  }

  function drawDiseaseOutcome(disease, infectionRisk) {
    if (Math.random() > infectionRisk) return null;

    const primaryOutcome = drawLayeredOutcome(disease.outcomes) || disease.outcomes[0];
    const longTermOutcome = drawLayeredOutcome(disease.long_term_effects);

    if (!longTermOutcome) {
      if (!disease.long_term_effects.length) return primaryOutcome;

      return {
        ...primaryOutcome,
        secondaryTitle: "Possible long-term consequences",
        secondaryDescription: disease.long_term_effects
          .map(effect => formatConditionalEffect(effect))
          .join(", ")
      };
    }

    return {
      label: primaryOutcome.label,
      description: primaryOutcome.description,
      severity: primaryOutcome.severity,
      secondaryTitle: "Long-term consequence",
      secondaryDescription: `${formatConditionalEffect(longTermOutcome)}. ${longTermOutcome.description}`,
      isRare: true
    };
  }

  function decorateDiseaseOutcome(outcome, longTermEffects = []) {
    if (!longTermEffects.length) return outcome;

    return {
      ...outcome,
      secondaryTitle: "Possible long-term consequences",
      secondaryDescription: longTermEffects
        .map(effect => formatConditionalEffect(effect))
        .join(", ")
    };
  }

  function drawOutcome(outcomes = []) {
    const random = Math.random();
    let cumulative = 0;

    for (const outcome of outcomes) {
      cumulative += outcome.probability;
      if (random < cumulative) return outcome;
    }

    return null;
  }

  function drawLayeredOutcome(outcomes = []) {
    const { commonOutcomes, rareOutcomes } = splitOutcomesByRarity(outcomes);
    const rareOutcome = drawOutcome(rareOutcomes);

    if (rareOutcome) {
      return {
        ...rareOutcome,
        isRare: true
      };
    }

    return drawOutcome(commonOutcomes);
  }

  function getOutcomeCellIndex(view, severity) {
    const matches = view.cells
      .map((cell, index) => ({ cell, index }))
      .filter(({ cell }) => severity ? cell.classList.contains(severity) : cell.className === "cell");

    if (!matches.length) return Math.floor(Math.random() * CELL_COUNT);
    return matches[Math.floor(Math.random() * matches.length)].index;
  }

  function formatProbability(probability, basis = "generic") {
    if (probability <= 0) return "";
    const normalizedBasis = normalizeProbabilityBasis(basis);
    if (probability >= PROBABILITY_COUNT_THRESHOLD) {
      return tf(`probability.out_of_100_${normalizedBasis}`, {
        count: Math.round(probability * PERCENT_SCALE)
      });
    }
    return tf(`probability.about_1_in_${normalizedBasis}`, {
      count: Math.round(1 / probability).toLocaleString()
    });
  }

  function formatConditionalEffect(effect) {
    return `${t(effect.short_label || effect.label)} (${formatConditionalProbability(effect.probability, effect.conditional_basis)})`;
  }

  function formatConditionalProbability(probability, basis = "severe_cases") {
    if (probability <= 0) return "";
    const normalizedBasis = basis === "survivors" ? "survivors" : "severe_cases";

    if (probability >= PROBABILITY_COUNT_THRESHOLD) {
      return tf(`probability.in_100_${normalizedBasis}`, {
        count: Math.round(probability * PERCENT_SCALE)
      });
    }
    return tf(`probability.about_1_in_${normalizedBasis}`, {
      count: Math.round(1 / probability).toLocaleString()
    });
  }

  function normalizeProbabilityBasis(basis) {
    return basis === "people" || basis === "vaccinations" ? basis : "generic";
  }

  function splitOutcomesByVisibility(primaryOutcomes = [], gridEntries = [], extraRareOutcomes = []) {
    const visibleLabels = new Set(
      gridEntries
        .map(entry => entry?.outcome?.label)
        .filter(Boolean)
    );

    return {
      commonOutcomes: primaryOutcomes.filter(outcome => visibleLabels.has(outcome.label)),
      rareOutcomes: [
        ...primaryOutcomes.filter(outcome => !visibleLabels.has(outcome.label)),
        ...extraRareOutcomes
      ]
    };
  }

  function splitOutcomesByRarity(outcomes = []) {
    return {
      commonOutcomes: outcomes.filter(outcome => !isRareOutcome(outcome)),
      rareOutcomes: outcomes.filter(isRareOutcome)
    };
  }

  function isRareOutcome(outcome) {
    return outcome.probability < RARE_OUTCOME_THRESHOLD;
  }

  function toPoint(index) {
    return { row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE };
  }

  function toIndex(row, col) {
    return row * GRID_SIZE + col;
  }

  function isInsideGrid(row, col) {
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
  }

  function getNeighborIndexes(index) {
    const { row, col } = toPoint(index);
    const neighbors = [];

    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
        if (rowOffset === 0 && colOffset === 0) continue;

        const nextRow = row + rowOffset;
        const nextCol = col + colOffset;
        if (isInsideGrid(nextRow, nextCol)) neighbors.push(toIndex(nextRow, nextCol));
      }
    }

    return neighbors;
  }

  return {
    loadData,
    resolveDiseaseIndex,
    getCurrentDisease,
    getVaccinationRate,
    getInfectionRisk,
    getTotalProbability,
    mapDisplayProbability,
    getDisplayProbability,
    normalizeSeverity,
    normalizeOutcomeSeverity,
    buildAbsoluteGridDistribution,
    buildConditionalGridDistribution,
    drawDiseaseOutcome,
    drawLayeredOutcome,
    getOutcomeCellIndex,
    formatProbability,
    splitOutcomesByVisibility,
    toPoint,
    toIndex,
    isInsideGrid,
    getNeighborIndexes
  };
}

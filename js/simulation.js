import {
  CELL_COUNT,
  FOCUS_MAX_RADIUS,
  FOCUS_MIN_DELAY_MS,
  FOCUS_STEPS,
  GRID_EFFECT_CLASSES,
  PANEL_KEYS,
  RESULT_FALLBACK_KEYS,
  ROLL_DURATION_MS,
  TRAIL_LENGTH,
  VACCINE_FOCUS_STEPS,
  VACCINE_ROLL_DURATION_MS,
  VACCINE_ROLL_STAGGER_MS
} from "./config.js";
import { delay } from "./utils.js";

const ANIMATION_EFFECT_CLASSES = GRID_EFFECT_CLASSES.filter(className => className !== "selected");

export function createSimulation(app, model, renderer) {
  const { elements, views, t } = app;

  async function runSimulation() {
    const disease = model.getCurrentDisease();
    const vaccine = disease.vaccine;
    const infectionRisk = model.getInfectionRisk(disease, model.getVaccinationRate());
    const vaccineOutcome = model.drawLayeredOutcome(vaccine.outcomes);
    const diseaseOutcome = model.drawDiseaseOutcome(disease, infectionRisk);

    setRollingState(true);
    renderer.clearResultPopups();
    clearCellEffects();

    const vaccineTarget = model.getOutcomeCellIndex(views.vaccine, model.normalizeOutcomeSeverity(vaccineOutcome));
    const diseaseTarget = model.getOutcomeCellIndex(views.disease, model.normalizeOutcomeSeverity(diseaseOutcome));

    const diseaseSequence = (async () => {
      await animateDiseaseFocus(views.disease, diseaseTarget);
      clearViewEffects(views.disease);
      highlightCell(views.disease, diseaseTarget);
      renderer.revealPanelResult("disease", diseaseOutcome);
    })();

    const vaccineSequence = (async () => {
      await animateVaccineFocus(views.vaccine, vaccineTarget);
      clearViewEffects(views.vaccine);
      highlightCell(views.vaccine, vaccineTarget);
      renderer.revealPanelResult("vaccine", vaccineOutcome);
    })();

    await Promise.all([diseaseSequence, vaccineSequence]);
    setRollingState(false);
  }

  function handleGridClick(event, panel) {
    const cell = event.target.closest(".cell");
    if (!cell || elements.testButton.disabled) return;

    const view = views[panel];
    if (!view.grid.contains(cell)) return;

    const index = Number(cell.dataset.index);
    const entry = app.state.gridEntries[panel][index];
    const fallback = t(RESULT_FALLBACK_KEYS[panel]);

    renderer.clearResultPopups();
    clearCellEffects();
    highlightCell(view, index);
    renderer.setResultPopup(view.result, {
      ...renderer.buildResultContent(entry?.outcome || null, fallback),
      contextLabel: t(panel === "vaccine" ? "From one vaccination:" : "From exposure:")
    });
  }

  function setRollingState(isRolling) {
    elements.testButton.disabled = isRolling;
    if (isRolling) restartDiceAnimation();
    if (!isRolling) elements.dice.classList.remove("is-rolling");
  }

  function restartDiceAnimation() {
    elements.dice.classList.remove("is-rolling");
    void elements.dice.offsetWidth;
    elements.dice.classList.add("is-rolling");
  }

  async function animateDiseaseFocus(view, targetIndex) {
    return animateFrames(view, createDiseaseFocusFrames(targetIndex), ROLL_DURATION_MS, "disease");
  }

  async function animateVaccineFocus(view, targetIndex) {
    await delay(VACCINE_ROLL_STAGGER_MS);
    return animateFrames(
      view,
      createSparseFrames(createVaccineFocusFrames(targetIndex)),
      VACCINE_ROLL_DURATION_MS,
      "vaccine"
    );
  }

  async function animateFrames(view, frames, duration, mode) {
    const frameDelay = Math.max(FOCUS_MIN_DELAY_MS, Math.round(duration / frames.length));
    const lastAnimatedIndex = mode === "vaccine"
      ? Math.max(0, frames.length - 2)
      : frames.length - 1;

    for (let frameIndex = 0; frameIndex <= lastAnimatedIndex; frameIndex += 1) {
      applyFocusFrame(view, frames, frameIndex, mode);
      await delay(frameDelay);
    }
  }

  function applyFocusFrame(view, frames, frameIndex, mode) {
    const active = new Map();
    const headIndex = frames[frameIndex];
    const trail = frames.slice(Math.max(0, frameIndex - TRAIL_LENGTH), frameIndex).reverse();
    const classes = getAnimationClasses(mode);

    active.set(headIndex, classes.head);
    trail.forEach((index, trailIndex) => {
      const trailClass = classes.trail[trailIndex];
      if (trailClass) active.set(index, trailClass);
    });

    if (classes.aura) {
      model.getNeighborIndexes(headIndex).forEach(index => {
        if (!active.has(index)) active.set(index, classes.aura);
      });

      if (!active.has(frames[frames.length - 1])) {
        active.set(frames[frames.length - 1], classes.aura);
      }
    }

    view.cells.forEach(cell => {
      cell.classList.remove(...ANIMATION_EFFECT_CLASSES);
    });

    active.forEach((className, index) => {
      const cell = view.cells[index];
      if (cell) cell.classList.add(className);
    });
  }

  function getAnimationClasses(mode) {
    if (mode === "vaccine") {
      return {
        head: "vaccine-roll-head",
        trail: ["vaccine-roll-trail-1", "vaccine-roll-trail-2", "vaccine-roll-trail-3"],
        aura: ""
      };
    }

    return {
      head: "roll-head",
      trail: ["roll-trail-1", "roll-trail-2", "roll-trail-3"],
      aura: "roll-aura"
    };
  }

  function createDiseaseFocusFrames(targetIndex) {
    const frames = [];

    for (let step = 0; step < FOCUS_STEPS - 1; step += 1) {
      const progress = step / Math.max(1, FOCUS_STEPS - 2);
      const radius = Math.max(1, Math.round((1 - progress) * FOCUS_MAX_RADIUS));
      frames.push(pickNearbyIndex(targetIndex, radius));
    }

    frames.push(targetIndex);
    return frames;
  }

  function createVaccineFocusFrames(targetIndex) {
    const frames = [];
    const maxRadius = Math.max(2, FOCUS_MAX_RADIUS + 1);

    for (let step = 0; step < VACCINE_FOCUS_STEPS - 1; step += 1) {
      const progress = step / Math.max(1, VACCINE_FOCUS_STEPS - 2);
      const radius = Math.max(0, Math.round((1 - progress) * maxRadius));
      const minDistance = step === 0
        ? Math.max(2, radius - 1)
        : step === 1
          ? Math.max(1, radius - 1)
          : 0;

      frames.push(pickFocusedIndex(targetIndex, radius, minDistance));
    }

    frames.push(targetIndex);
    return dedupeSequentialFrames(frames, targetIndex);
  }

  function createSparseFrames(frames) {
    return frames.filter((_, index) => index % 2 === 0 || index === frames.length - 1);
  }

  function dedupeSequentialFrames(frames, targetIndex) {
    const deduped = [];

    frames.forEach(index => {
      if (deduped[deduped.length - 1] !== index) deduped.push(index);
    });

    if (deduped[deduped.length - 1] !== targetIndex) deduped.push(targetIndex);
    return deduped;
  }

  function pickFocusedIndex(targetIndex, radius, minDistance) {
    const target = model.toPoint(targetIndex);
    const candidates = [];

    for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
      for (let colOffset = -radius; colOffset <= radius; colOffset += 1) {
        const row = target.row + rowOffset;
        const col = target.col + colOffset;
        if (!model.isInsideGrid(row, col)) continue;

        const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
        if (distance < minDistance || distance > radius) continue;

        candidates.push(model.toIndex(row, col));
      }
    }

    if (!candidates.length) {
      return pickNearbyIndex(targetIndex, Math.max(radius, 1));
    }

    return candidates[Math.floor(Math.random() * candidates.length)] ?? targetIndex;
  }

  function pickNearbyIndex(targetIndex, radius) {
    const target = model.toPoint(targetIndex);
    const candidates = [];

    for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
      for (let colOffset = -radius; colOffset <= radius; colOffset += 1) {
        const row = target.row + rowOffset;
        const col = target.col + colOffset;
        if (!model.isInsideGrid(row, col)) continue;

        const index = model.toIndex(row, col);
        const distance = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
        const weight = Math.max(1, radius + 2 - distance);

        for (let repeat = 0; repeat < weight; repeat += 1) candidates.push(index);
      }
    }

    return candidates[Math.floor(Math.random() * candidates.length)] ?? targetIndex;
  }

  function clearCellEffects() {
    PANEL_KEYS.forEach(panel => {
      clearViewEffects(views[panel]);
    });
  }

  function clearViewEffects(view) {
    view.cells.forEach(cell => cell.classList.remove(...GRID_EFFECT_CLASSES));
  }

  function highlightCell(view, index) {
    const cell = view.cells[index];
    if (cell) cell.classList.add("selected");
  }

  return {
    clearCellEffects,
    handleGridClick,
    runSimulation
  };
}

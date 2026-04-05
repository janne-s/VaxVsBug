export const CELL_COUNT = 100;
export const GRID_SIZE = 10;
export const DEFAULT_SLIDER_VALUE = 60;
export const ROLL_DURATION_MS = 900;
export const VACCINE_ROLL_DURATION_MS = 760;
export const VACCINE_ROLL_STAGGER_MS = 650;
export const FOCUS_STEPS = 16;
export const VACCINE_FOCUS_STEPS = 6;
export const TRAIL_LENGTH = 3;
export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "fi"];
export const PERCENT_SCALE = 100;
export const SLIDER_MAX = 100;
export const RARE_OUTCOME_THRESHOLD = 0.01;
export const PROBABILITY_COUNT_THRESHOLD = 0.1;
export const FOCUS_MAX_RADIUS = 4;
export const FOCUS_MIN_DELAY_MS = 28;
export const PANEL_TRANSITION_MS = 220;
export const GRID_EFFECT_CLASSES = [
  "selected",
  "roll-head",
  "roll-trail-1",
  "roll-trail-2",
  "roll-trail-3",
  "roll-aura",
  "vaccine-roll-head",
  "vaccine-roll-trail-1",
  "vaccine-roll-trail-2",
  "vaccine-roll-trail-3"
];
export const PANEL_KEYS = ["vaccine", "disease"];
export const RESULT_FALLBACK_KEYS = {
  vaccine: "No side effects",
  disease: "No infection"
};
export const PROBABILITY_BASIS = {
  vaccine: "vaccinations",
  disease: "people"
};
export const SLIDER_POSITION_PROPERTY = "--slider-position";

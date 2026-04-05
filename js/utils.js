export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function delay(duration) {
  return new Promise(resolve => window.setTimeout(resolve, duration));
}

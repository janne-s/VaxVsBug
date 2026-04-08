import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "./config.js";

export async function loadMessages(lang) {
  const response = await fetch(`locales/${lang}.json`);
  if (!response.ok) throw new Error(`Failed to load locale: ${lang}`);
  return response.json();
}

export function normalizeLanguageCode(value) {
  if (!value) return "";
  const normalized = value.toLowerCase().split("-")[0];
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : "";
}

export function resolveLanguage() {
  const params = new URLSearchParams(window.location.search);
  const requested = normalizeLanguageCode(params.get("lang"));
  if (requested) return requested;

  return DEFAULT_LANGUAGE;
}

export function createTranslator(state) {
  return {
    t(text) {
      return state.messages.strings?.[text] || text;
    },
    tf(key, variables = {}) {
      const template = state.messages.templates?.[key] || "";
      if (!template) return key;

      return template.replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? "");
    }
  };
}

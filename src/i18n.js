// kc-frontend/src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Load bundled dictionaries
import en from "./locales/en/common.json";
import ko from "./locales/ko/common.json";

// storage keys
const LS_LANG_KEY = "kc_lang";

// pick saved lang or default
export function getLangPref() {
  try {
    const v = localStorage.getItem(LS_LANG_KEY);
    return v === "ko" ? "ko" : "en";
  } catch {
    return "en";
  }
}
export function setLangPref(v) {
  const lang = v === "ko" ? "ko" : "en";
  try { localStorage.setItem(LS_LANG_KEY, lang); } catch {}
  i18n.changeLanguage(lang);
}

// Dev helper: collect missing keys so you can add them later.
if (typeof window !== "undefined") {
  window.__i18nMissing = window.__i18nMissing || new Set();
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      ko: { common: ko },
    },
    lng: getLangPref(),
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnEmptyString: true,

    // Track any missing keys so you never miss future English text
    saveMissing: false, // we’re not sending to a server
    missingKeyHandler: (lng, ns, key) => {
      if (typeof window !== "undefined" && window.__i18nMissing) {
        window.__i18nMissing.add(`${ns}:${key}`);
        // Optional: show once in console
        // eslint-disable-next-line no-console
        console.warn("[i18n] Missing key:", `${ns}:${key}`, "lang:", lng);
      }
    },
  });

export default i18n;
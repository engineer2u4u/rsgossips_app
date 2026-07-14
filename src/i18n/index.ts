// Mobile i18n foundation (i18next + react-i18next).
//
// English is the source of truth. To add a language:
//   1. Create src/i18n/<code>.json (copy en.json and translate the values).
//   2. Import it and add it to `resources` + SUPPORTED_LOCALES below.
// Components read strings with useTranslation(): const { t } = useTranslation();
// t('common.save'). Change language at runtime with setLanguage('<code>').
//
// This file is imported for its side effect (init) once, from App.tsx.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';

export const SUPPORTED_LOCALES = ['en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const resources = {
  en: { translation: en },
} as const;

const STORAGE_KEY = 'rg.lang';

// init() is synchronous so the first render already has strings (defaults to
// English). We then restore any persisted choice asynchronously and switch.
i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
  returnNull: false,
});

AsyncStorage.getItem(STORAGE_KEY)
  .then((lang) => {
    if (lang && (SUPPORTED_LOCALES as readonly string[]).includes(lang) && lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
  })
  .catch(() => {
    /* non-fatal — stay on the default language */
  });

// Persist + apply a new language. Call from a language switcher.
export async function setLanguage(lang: AppLocale) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* non-fatal */
  }
  await i18n.changeLanguage(lang);
}

export default i18n;

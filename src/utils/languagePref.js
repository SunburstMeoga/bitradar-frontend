import i18n from '../i18n'
import { detectLanguageByIP } from './ipLanguage'

const KEY_LANG = 'i18nextLng'
const KEY_MANUAL = 'i18nextLng_manual'

export function getStoredLanguage() {
  try {
    return localStorage.getItem(KEY_LANG) || null
  } catch (_) {
    return null
  }
}

export function isManualSelection() {
  try {
    return localStorage.getItem(KEY_MANUAL) === 'true'
  } catch (_) {
    return false
  }
}

export async function setLanguagePreference(langCode, manual = true) {
  try {
    if (manual) localStorage.setItem(KEY_MANUAL, 'true')
    localStorage.setItem(KEY_LANG, langCode)
  } catch (_) {}
  try {
    await i18n.changeLanguage(langCode)
  } catch (_) {}
}

export function clearManualSelection() {
  try {
    localStorage.removeItem(KEY_MANUAL)
  } catch (_) {}
}

export async function applyStartupLanguage() {
  try {
    const manual = isManualSelection()
    const stored = getStoredLanguage()
    if (manual && stored) {
      await i18n.changeLanguage(stored)
      return 'manual'
    }
    const locale = await detectLanguageByIP()
    if (locale) {
      localStorage.setItem(KEY_LANG, locale)
      await i18n.changeLanguage(locale)
      return 'auto'
    }
    return 'fallback'
  } catch (e) {
    console.warn('[languagePref] startup apply failed:', e)
    return 'error'
  }
}
/**
 * UI strings helper.
 *
 * Loads i18n/{locale}.json at build time. Validates that every active locale
 * has all keys defined in the EN bundle — otherwise build fails. Falls back
 * to EN at runtime ONLY for non-active locales (active locales must be complete).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { allLocales, defaultLocale, type LocaleCode } from './locales';

const I18N_DIR = resolve(process.cwd(), 'i18n');

type StringsBundle = Record<string, string>;

function loadBundle(localeCode: LocaleCode): StringsBundle {
  const path = resolve(I18N_DIR, `${localeCode}.json`);
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as StringsBundle;
}

const BUNDLES: Record<string, StringsBundle> = {};
const DEFAULT = defaultLocale().code;
BUNDLES[DEFAULT] = loadBundle(DEFAULT);

const REFERENCE_KEYS = new Set(Object.keys(BUNDLES[DEFAULT]!));

for (const locale of allLocales()) {
  if (locale.code === DEFAULT) continue;
  let bundle: StringsBundle;
  try {
    bundle = loadBundle(locale.code);
  } catch (e) {
    throw new Error(
      `Missing UI strings for active locale "${locale.code}". ` +
      `Create i18n/${locale.code}.json with all keys from i18n/${DEFAULT}.json.`
    );
  }
  // Validate completeness
  const missing: string[] = [];
  for (const key of REFERENCE_KEYS) {
    if (!(key in bundle)) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `Locale "${locale.code}" is missing keys: ${missing.join(', ')}.\n` +
      `Reference: i18n/${DEFAULT}.json`
    );
  }
  BUNDLES[locale.code] = bundle;
}

/**
 * Return a translated string for a key in a given locale.
 * Falls back to the default locale if the key is missing (should not happen
 * with active locales — build validates completeness).
 */
export function t(localeCode: string, key: string, vars?: Record<string, string>): string {
  const bundle = BUNDLES[localeCode] ?? BUNDLES[DEFAULT]!;
  let value = bundle[key] ?? BUNDLES[DEFAULT]![key];
  if (value === undefined) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Missing key "${key}" in locale "${localeCode}"`);
    }
    return key; // surfaces visibly in dev
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return value;
}

/**
 * Curried helper for templates: const tt = withLocale('de'); tt('nav.home')
 */
export function withLocale(localeCode: string) {
  return (key: string, vars?: Record<string, string>) => t(localeCode, key, vars);
}

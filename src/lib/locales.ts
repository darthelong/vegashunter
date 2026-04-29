/**
 * Locale registry — single source of truth, parsed at build time from
 * data/locales.yaml. Used by:
 *   - URL builders (translated path segments per locale)
 *   - Hreflang generation
 *   - Language switcher
 *   - Build-time validation (every locale must have a complete UI strings JSON)
 */

import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_PATH = resolve(__dirname, '../../data/locales.yaml');

const LocalePathsSchema = z.object({
  reviews: z.string(),
  blog: z.string(),
  providers: z.string(),
  slots: z.string(),
  payment_methods: z.string(),
  bonuses: z.string(),
  authors: z.string(),
  methodology: z.string(),
});

const LocaleSchema = z.object({
  code: z.string(),
  name: z.string(),
  hreflang: z.string(),
  is_default: z.boolean().optional(),
  is_x_default: z.boolean().optional(),
  market_scope: z.string(),
  currency_default: z.string(),
  status: z.enum(['active', 'inactive']),
  paths: LocalePathsSchema,
});

export type Locale = z.infer<typeof LocaleSchema>;
export type LocaleCode = Locale['code'];
export type LocalePathKey = keyof Locale['paths'];

const raw = readFileSync(LOCALES_PATH, 'utf-8');
const parsed = parseYaml(raw);
const LOCALES: Locale[] = z.array(LocaleSchema).parse(parsed);

const DEFAULT_LOCALE = LOCALES.find((l) => l.is_default)?.code ?? 'en';
const X_DEFAULT_LOCALE = LOCALES.find((l) => l.is_x_default)?.code ?? DEFAULT_LOCALE;

export const SITE_URL = 'https://vegashunter.pro';

export function allLocales(): Locale[] {
  return LOCALES.filter((l) => l.status === 'active');
}

export function localeByCode(code: string): Locale | undefined {
  return LOCALES.find((l) => l.code === code);
}

export function defaultLocale(): Locale {
  const l = localeByCode(DEFAULT_LOCALE);
  if (!l) throw new Error('No default locale defined in data/locales.yaml');
  return l;
}

export function xDefaultLocale(): Locale {
  return localeByCode(X_DEFAULT_LOCALE) ?? defaultLocale();
}

/**
 * Build a locale-prefixed URL. Use this everywhere instead of hardcoding
 * `/${locale}/...` paths — paths are translated per locale.
 *
 * Example:
 *   buildPath('de', 'reviews', 'slotoro-bewertung')
 *     → '/de/bewertungen/slotoro-bewertung/'
 *   buildPath('en', 'home')
 *     → '/en/'
 */
export function buildPath(
  localeCode: string,
  segment: LocalePathKey | 'home',
  slug?: string,
): string {
  const locale = localeByCode(localeCode);
  if (!locale) throw new Error(`Unknown locale: ${localeCode}`);

  if (segment === 'home') {
    return `/${locale.code}/`;
  }
  const seg = locale.paths[segment];
  if (slug) {
    return `/${locale.code}/${seg}/${slug}/`;
  }
  return `/${locale.code}/${seg}/`;
}

/**
 * Detect locale from a pathname. Returns the matched locale or undefined.
 */
export function localeFromPath(pathname: string): Locale | undefined {
  const stripped = pathname.replace(/^\/+/, '');
  const first = stripped.split('/')[0];
  return localeByCode(first ?? '');
}

/**
 * Hreflang link tag data — emit one per locale on every multilingual page.
 * Pass the current page's "logical" key (e.g. 'home', or a review casino_slug)
 * and a function that returns the path for each locale (or undefined if the
 * resource doesn't exist in that locale — language switcher behavior).
 */
export function alternateLinks(
  resolveForLocale: (locale: Locale) => string | undefined,
): Array<{ hreflang: string; href: string }> {
  const out: Array<{ hreflang: string; href: string }> = [];
  for (const locale of allLocales()) {
    const path = resolveForLocale(locale);
    if (path) {
      out.push({ hreflang: locale.hreflang, href: `${SITE_URL}${path}` });
    }
  }
  // x-default points to the global English version
  const xPath = resolveForLocale(xDefaultLocale());
  if (xPath) {
    out.push({ hreflang: 'x-default', href: `${SITE_URL}${xPath}` });
  }
  return out;
}

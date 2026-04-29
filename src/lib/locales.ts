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
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

const LOCALES_PATH = resolve(process.cwd(), 'data/locales.yaml');

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
  /** Shown in the language switcher dropdown (5 base locales). Defaults true for back-compat. */
  visible_in_switcher: z.boolean().default(true),
  /** If this is a regional variant, which base locale does it cover (e.g. 'en-ca' → 'en'). */
  regional_of: z.string().optional(),
  /** ISO 3166-1 alpha-2 country codes that should be auto-redirected to this locale by the CF middleware. */
  country_codes: z.array(z.string().length(2)).optional(),
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

/**
 * Locales visible in the language-switcher dropdown.
 * Currently the 5 base languages (en, de, es, pt, ru). Regional variants
 * (en-ca/gb/ie, es-ar/mx, pt-br) are reached automatically via the CF
 * Pages middleware based on CF-IPCountry — never picked manually from
 * the switcher.
 */
export function switcherLocales(): Locale[] {
  return allLocales().filter((l) => l.visible_in_switcher !== false);
}

/**
 * Country code → regional locale code map (e.g. { GB: 'en-gb', CA: 'en-ca' }).
 * Built from `country_codes` declarations in data/locales.yaml.
 * Used by the CF middleware to route GB visitors on /en/ to /en-gb/.
 */
export function regionalByCountry(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of allLocales()) {
    if (!l.country_codes) continue;
    for (const cc of l.country_codes) {
      out[cc.toUpperCase()] = l.code;
    }
  }
  return out;
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

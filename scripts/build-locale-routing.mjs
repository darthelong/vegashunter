#!/usr/bin/env node
/**
 * Pre-build step: read data/locales.yaml and write functions/_locale-routing.json
 * so the CF Pages middleware can do regional auto-redirect without re-parsing
 * YAML at the edge.
 *
 * Output shape:
 * {
 *   regionalByCountry: { CA: 'en-ca', GB: 'en-gb', ... },
 *   baseLocales:       ['en', 'de', 'es', 'pt', 'ru'],
 *   regionalLocales:   ['en-ca', 'en-gb', 'en-ie', 'es-ar', 'es-mx', 'pt-br']
 * }
 *
 * Wired into npm `prebuild` alongside build-blocked-countries + build-sitemap.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SRC = resolve(ROOT, 'data/locales.yaml');
const DST = resolve(ROOT, 'functions/_locale-routing.json');

const locales = parseYaml(readFileSync(SRC, 'utf-8'))
  .filter((l) => l?.status === 'active');

const regionalByCountry = {};
const baseLocales = [];
const regionalLocales = [];

for (const l of locales) {
  if (l.regional_of) {
    regionalLocales.push(l.code);
    if (Array.isArray(l.country_codes)) {
      for (const cc of l.country_codes) {
        regionalByCountry[String(cc).toUpperCase()] = l.code;
      }
    }
  } else if (l.visible_in_switcher !== false) {
    baseLocales.push(l.code);
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  source: 'data/locales.yaml',
  regionalByCountry,
  baseLocales,
  regionalLocales,
};

mkdirSync(dirname(DST), { recursive: true });
writeFileSync(DST, JSON.stringify(output, null, 2) + '\n', 'utf-8');

console.log(
  `[build-locale-routing] wrote ${DST}\n` +
  `  base locales:     ${baseLocales.join(', ')}\n` +
  `  regional locales: ${regionalLocales.join(', ')}\n` +
  `  country mapping:  ${Object.entries(regionalByCountry).map(([k, v]) => `${k}→${v}`).join(', ')}`
);

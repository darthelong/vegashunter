#!/usr/bin/env node
/**
 * Pre-build step: read data/blocked-countries.yaml and write
 * functions/_blocked-countries.json so the CF Pages middleware has a single
 * source of truth.
 *
 * Wired in package.json `prebuild` script.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SRC = resolve(ROOT, 'data/blocked-countries.yaml');
const DST = resolve(ROOT, 'functions/_blocked-countries.json');

const raw = readFileSync(SRC, 'utf-8');
const parsed = parseYaml(raw);

if (!parsed?.blocked || !Array.isArray(parsed.blocked)) {
  console.error(`[build-blocked-countries] Malformed YAML in ${SRC}`);
  process.exit(1);
}

const codes = parsed.blocked.map((entry) => {
  if (!entry?.code || typeof entry.code !== 'string') {
    console.error(`[build-blocked-countries] Bad entry: ${JSON.stringify(entry)}`);
    process.exit(1);
  }
  return entry.code.toUpperCase();
});

const json = {
  generatedAt: new Date().toISOString(),
  source: 'data/blocked-countries.yaml',
  codes,
};

mkdirSync(dirname(DST), { recursive: true });
writeFileSync(DST, JSON.stringify(json, null, 2) + '\n', 'utf-8');

console.log(`[build-blocked-countries] wrote ${DST} (${codes.length} codes: ${codes.join(', ')})`);

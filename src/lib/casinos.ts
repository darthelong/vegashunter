/**
 * Casino + AffiliateLink registry.
 *
 * Loads all data/casinos/*.yaml and data/affiliate-links.yaml at build time.
 * Validates with Zod. Build fails on the first invalid file with a clear
 * error that includes the file path and the failing field.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

import {
  CasinoSchema,
  AffiliateLinksFileSchema,
  type Casino,
  type AffiliateLink,
} from './schemas';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');

// ---------- Casinos ----------
const CASINOS: Map<string, Casino> = new Map();
{
  const dir = resolve(DATA_DIR, 'casinos');
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.yaml')) continue;
    const path = resolve(dir, file);
    const raw = readFileSync(path, 'utf-8');
    const parsed = parseYaml(raw);
    const result = CasinoSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid casino in ${file}:\n${result.error.issues
          .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
          .join('\n')}`
      );
    }
    if (CASINOS.has(result.data.slug)) {
      throw new Error(`Duplicate casino slug "${result.data.slug}" in ${file}`);
    }
    CASINOS.set(result.data.slug, result.data);
  }
}

// ---------- Affiliate links ----------
const LINKS: Map<string, AffiliateLink> = new Map();
{
  const path = resolve(DATA_DIR, 'affiliate-links.yaml');
  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch {
    raw = '[]';
  }
  const parsed = parseYaml(raw);
  const arr = AffiliateLinksFileSchema.parse(parsed ?? []);
  for (const link of arr) {
    if (LINKS.has(link.id)) {
      throw new Error(`Duplicate affiliate link id "${link.id}" in ${path}`);
    }
    LINKS.set(link.id, link);
  }
}

// ---------- Public API ----------
export function getCasino(slug: string): Casino | undefined {
  return CASINOS.get(slug);
}
export function requireCasino(slug: string): Casino {
  const c = CASINOS.get(slug);
  if (!c) throw new Error(`Casino "${slug}" not found in data/casinos/`);
  return c;
}
export function allActiveCasinos(): Casino[] {
  return Array.from(CASINOS.values()).filter((c) => c.status === 'active');
}

export function getAffiliateLink(id: string): AffiliateLink | undefined {
  return LINKS.get(id);
}
export function requireAffiliateLink(id: string): AffiliateLink {
  const l = LINKS.get(id);
  if (!l) throw new Error(`Affiliate link "${id}" not found in data/affiliate-links.yaml`);
  return l;
}

/**
 * Build the final outbound URL for an affiliate CTA.
 * Substitutes template params like {clickid}, {sub1}, {sub2} into link.url.
 *
 * Pass page-context params from the caller — the helper does NOT generate
 * a clickid (the affiliate network does, server-side, on the redirect leg).
 *
 * Example:
 *   buildAffiliateUrl('slotoro-de', { sub1: 'review', sub2: 'slotoro-bewertung' })
 */
export function buildAffiliateUrl(
  linkId: string,
  params: Record<string, string> = {}
): string {
  const link = requireAffiliateLink(linkId);
  let url = link.url;
  for (const [k, v] of Object.entries(params)) {
    url = url.replaceAll(`{${k}}`, encodeURIComponent(v));
  }
  // Strip any unfilled placeholders so we never leak {clickid} into the wild.
  url = url.replace(/[?&][^?&=]+=\{[^}]+\}/g, '').replace(/\{[^}]+\}/g, '');
  return url;
}

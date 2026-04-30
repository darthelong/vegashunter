/**
 * External ratings registry — reads data/external-ratings/{casino}.yaml.
 * Each file holds the manually-curated competitor scores (AskGamblers,
 * Casino.guru, Trustpilot, …). Missing files = no external data for that
 * casino, the ranking algorithm drops the `competitors` input from the
 * formula and renormalises the remaining weights for that casino only.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  ExternalRatingsFileSchema,
  type ExternalSource,
  type ExternalRatingsFile,
} from './schemas';

const DIR = resolve(process.cwd(), 'data/external-ratings');

const RATINGS = new Map<string, ExternalRatingsFile>();
{
  if (existsSync(DIR)) {
    for (const file of readdirSync(DIR)) {
      if (!file.endsWith('.yaml')) continue;
      const path = resolve(DIR, file);
      const raw = readFileSync(path, 'utf-8');
      const parsed = parseYaml(raw);
      const result = ExternalRatingsFileSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `Invalid external ratings in ${file}:\n${result.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`
        );
      }
      RATINGS.set(result.data.casino, result.data);
    }
  }
}

/** All sources we'll consider when computing competitors_avg unless the ranking config overrides. */
export const DEFAULT_COMPETITOR_POOL: ExternalSource[] = ['askgamblers', 'casino-guru', 'trustpilot'];

export function getExternalRatings(casinoSlug: string): ExternalRatingsFile | undefined {
  return RATINGS.get(casinoSlug);
}

/**
 * Computes the `competitors` input (0–10).
 * Returns null when no source from the pool has a rating for this casino —
 * the algorithm then drops this input from the weighted sum and renormalises.
 */
export function competitorsAvg(
  casinoSlug: string,
  pool: ExternalSource[] = DEFAULT_COMPETITOR_POOL,
): number | null {
  const file = RATINGS.get(casinoSlug);
  if (!file) return null;
  const matched = file.ratings.filter((r) => pool.includes(r.source));
  if (matched.length === 0) return null;
  const sum = matched.reduce((acc, r) => acc + r.score, 0);
  return sum / matched.length;
}

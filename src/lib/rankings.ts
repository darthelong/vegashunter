/**
 * Ranking config registry — reads data/rankings/{locale}/{slug}.yaml.
 *
 * One file per ranking. The locale is the immediate parent folder. Schema is
 * `RankingConfig` from src/lib/schemas.ts.
 *
 * Conventions:
 *   - data/rankings/en/main.yaml          → Tier 1 main ranking for /en/
 *   - data/rankings/de/main.yaml          → Tier 1 main ranking for /de/
 *   - data/rankings/en/best-mobile.yaml   → Tier 2 longtail at /en/best-mobile/
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { RankingConfigSchema, type RankingConfig } from './schemas';

const DIR = resolve(process.cwd(), 'data/rankings');

const RANKINGS = new Map<string, RankingConfig>(); // key: `${locale}::${slug}`
const BY_LOCALE = new Map<string, RankingConfig[]>();

{
  if (existsSync(DIR)) {
    for (const localeDir of readdirSync(DIR)) {
      const localePath = join(DIR, localeDir);
      if (!statSync(localePath).isDirectory()) continue;
      for (const file of readdirSync(localePath)) {
        if (!file.endsWith('.yaml')) continue;
        const path = resolve(localePath, file);
        const raw = readFileSync(path, 'utf-8');
        const parsed = parseYaml(raw);
        const result = RankingConfigSchema.safeParse(parsed);
        if (!result.success) {
          throw new Error(
            `Invalid ranking config in ${localeDir}/${file}:\n${result.error.issues
              .map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`
          );
        }
        // Cross-check: locale folder matches `locale` field
        if (result.data.locale !== localeDir) {
          throw new Error(
            `Ranking config ${file} declares locale "${result.data.locale}" but lives in folder "${localeDir}"`
          );
        }
        const key = `${result.data.locale}::${result.data.slug}`;
        if (RANKINGS.has(key)) {
          throw new Error(`Duplicate ranking ${key}`);
        }
        RANKINGS.set(key, result.data);
        const list = BY_LOCALE.get(result.data.locale) ?? [];
        list.push(result.data);
        BY_LOCALE.set(result.data.locale, list);
      }
    }
  }
}

export function getRanking(locale: string, slug: string): RankingConfig | undefined {
  return RANKINGS.get(`${locale}::${slug}`);
}

export function rankingsForLocale(locale: string): RankingConfig[] {
  return BY_LOCALE.get(locale) ?? [];
}

export function allRankings(): RankingConfig[] {
  return Array.from(RANKINGS.values());
}

/** The "main" ranking for a locale = home page. Conventionally slug='main'. */
export function mainRankingFor(locale: string): RankingConfig | undefined {
  return getRanking(locale, 'main');
}

/**
 * Semrush traffic registry — reads data/semrush/{domain}.yaml.
 *
 * Manual exports from the public Semrush top list (https://www.semrush.com/website/top/global/gambling/).
 * Missing data = `traffic` input dropped from the ranking formula for that casino.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { SemrushDataSchema, type SemrushData } from './schemas';

const DIR = resolve(process.cwd(), 'data/semrush');

const DATA = new Map<string, SemrushData>();
{
  if (existsSync(DIR)) {
    for (const file of readdirSync(DIR)) {
      if (!file.endsWith('.yaml')) continue;
      const path = resolve(DIR, file);
      const raw = readFileSync(path, 'utf-8');
      const parsed = parseYaml(raw);
      const result = SemrushDataSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `Invalid Semrush data in ${file}:\n${result.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`
        );
      }
      DATA.set(result.data.domain.toLowerCase(), result.data);
    }
  }
}

export function getSemrushData(domain: string): SemrushData | undefined {
  return DATA.get(domain.toLowerCase());
}

export function allSemrushData(): SemrushData[] {
  return Array.from(DATA.values());
}

/**
 * Compute `traffic` input (0–10) by log-normalising organic traffic across
 * the pool of casinos we're ranking. Each casino is scored relative to the
 * loudest in the pool. Returns null if this casino has no Semrush data.
 *
 * Why log-normalised: organic-traffic distributions are extremely heavy-tailed.
 * A casino with 1M visits shouldn't monopolise the score against one with 100K.
 */
export function trafficScore(domain: string, pool: SemrushData[]): number | null {
  const me = getSemrushData(domain);
  if (!me?.organic_traffic) return null;
  const peers = pool.filter((p) => (p.organic_traffic ?? 0) > 0);
  if (peers.length === 0) return null;
  const max = Math.max(...peers.map((p) => p.organic_traffic ?? 0));
  if (max <= 0) return null;
  const norm = Math.log(1 + (me.organic_traffic ?? 0)) / Math.log(1 + max);
  return Math.max(0, Math.min(10, norm * 10));
}

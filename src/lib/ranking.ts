/**
 * Ranking algorithm — pure scoring function.
 *
 * Per the Sprint 2 design (docs/sprint-2-ranking-algorithm.md), each casino
 * gets a weighted score from up to six inputs:
 *
 *   editorial   — our review's overall score
 *   competitors — averaged AskGamblers / Casino.guru / Trustpilot
 *   market_fit  — heuristic against locale (currency, regulator, tags)
 *   commercial  — affiliate link cpa_value (always disclosed via PARTNER badge)
 *   traffic     — log-normalised Semrush organic traffic
 *   freshness   — linear decay if last_reviewed_at > 6 months
 *
 * Missing inputs are DROPPED, not imputed. The remaining weights are
 * renormalised to sum to 1.0 for that casino. This is fairer to fresh casinos
 * with thin data than zero-imputation, and the audit JSON shows exactly what
 * was used for each position.
 *
 * Featured slugs are pinned to the top in config order (regardless of score).
 * Boost multipliers apply post-scoring. Excluded slugs are removed up front.
 */

import type { CollectionEntry } from 'astro:content';
import type {
  Casino,
  RankingConfig,
  RankingPosition,
  RankingWeights,
  AffiliateLink,
} from './schemas';
import type { Locale } from './locales';
import { competitorsAvg, DEFAULT_COMPETITOR_POOL } from './external-ratings';
import { trafficScore, allSemrushData } from './semrush';

const DEFAULT_WEIGHTS: RankingWeights = {
  editorial:   0.30,
  competitors: 0.20,
  market_fit:  0.15,
  commercial:  0.15,
  traffic:     0.10,
  freshness:   0.10,
};

// ---------- Per-input computation ----------

function editorialScore(reviewFM: { score: number } | undefined): number | null {
  return reviewFM?.score ?? null;
}

/**
 * Heuristic market fit (0–10). Five-point checklist:
 *   +3 currency match (casino default vs locale default)
 *   +3 regulator/license fit (eu_licensed casino + EU locale)
 *   +2 mobile_friendly tag
 *   +1 fast_payout tag
 *   +1 live_casino tag (richer offer for engaged markets)
 * Cap at 10. We'll grow this once per-casino market data is richer.
 */
function marketFitScore(casino: Casino, locale: Locale): number {
  let pts = 0;
  if (casino.default_currency.toUpperCase() === locale.currency_default.toUpperCase()) pts += 3;
  const euLocaleCodes = ['en-gb', 'en-ie', 'de', 'es', 'pt'];
  if (casino.tags.includes('eu_licensed') && euLocaleCodes.includes(locale.code)) pts += 3;
  if (casino.tags.includes('mobile_friendly')) pts += 2;
  if (casino.tags.includes('fast_payout'))     pts += 1;
  if (casino.tags.includes('live_casino'))     pts += 1;
  return Math.min(10, pts);
}

/**
 * Commercial: pull from affiliate-links cpa_value.
 * Prefer locale-specific link (e.g. slotoro-de over slotoro-en for DE).
 * Fallback: any link for this casino.
 */
function commercialScore(
  casino: Casino,
  localeCode: string,
  links: AffiliateLink[],
): number | null {
  const forCasino = links.filter((l) => l.casino === casino.slug && l.active);
  if (forCasino.length === 0) return null;
  // Prefer link whose id ends with the locale (e.g. slotoro-de). Otherwise first one.
  const localeMatch = forCasino.find((l) => l.id.endsWith(`-${localeCode}`)) ?? forCasino[0]!;
  return localeMatch.cpa_value ?? null;
}

/**
 * Freshness: linear from 10.0 (just published) down to 0 (12+ months).
 */
function freshnessScore(lastReviewedAt: Date, today: Date): number {
  const days = (today.getTime() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 0) return 10;
  if (days >= 365) return 0;
  return 10 * (1 - days / 365);
}

// ---------- Weight renormalisation ----------

function renormaliseWeights(
  weights: RankingWeights,
  available: Set<keyof RankingWeights>,
): RankingWeights {
  const present = (Object.keys(weights) as Array<keyof RankingWeights>)
    .filter((k) => available.has(k));
  const sum = present.reduce((acc, k) => acc + weights[k], 0);
  if (sum === 0) {
    // Edge case: nothing usable. Return uniform across keys.
    const u = 1 / present.length;
    return Object.fromEntries(present.map((k) => [k, u])) as RankingWeights;
  }
  const out = { editorial: 0, competitors: 0, market_fit: 0, commercial: 0, traffic: 0, freshness: 0 };
  for (const k of present) {
    (out as RankingWeights)[k] = weights[k] / sum;
  }
  return out;
}

// ---------- Public scoring entry point ----------

export interface RankingComputeInput {
  config: RankingConfig;
  locale: Locale;
  /** All casinos to potentially include (will be filtered by required_tags + exclude). */
  candidates: Casino[];
  /** Editorial review score per casino_slug, in this locale only. */
  editorialByCasino: Map<string, { score: number; last_reviewed_at: Date }>;
  /** All affiliate links (the function picks per casino × locale). */
  affiliateLinks: AffiliateLink[];
  /** Today's date — pass for testability. Defaults to system clock. */
  today?: Date;
}

export function computeRanking(input: RankingComputeInput): RankingPosition[] {
  const { config, locale, candidates, editorialByCasino, affiliateLinks } = input;
  const today = input.today ?? new Date();
  const weights = config.weights ?? DEFAULT_WEIGHTS;

  const semrushPool = allSemrushData();
  const requiredTags = new Set(config.required_tags);
  const excludeSet = new Set(config.exclude);

  // ---- 1) Filter pool ----
  const pool = candidates.filter((c) => {
    if (c.status !== 'active') return false;
    if (excludeSet.has(c.slug)) return false;
    for (const t of requiredTags) {
      if (!c.tags.includes(t)) return false;
    }
    return true;
  });

  // ---- 2) Score each casino ----
  const scored: RankingPosition[] = pool.map((casino) => {
    const review = editorialByCasino.get(casino.slug);
    const ed = editorialScore(review);
    const co = competitorsAvg(casino.slug, DEFAULT_COMPETITOR_POOL);
    const mf = marketFitScore(casino, locale);
    const cm = commercialScore(casino, locale.code, affiliateLinks);
    const tr = trafficScore(`${casino.slug}.com`, semrushPool);
    const fr = review ? freshnessScore(review.last_reviewed_at, today) : null;

    const inputs = {
      editorial:   ed,
      competitors: co,
      market_fit:  mf,
      commercial:  cm,
      traffic:     tr,
      freshness:   fr,
    };

    const available = new Set<keyof RankingWeights>();
    if (ed != null) available.add('editorial');
    if (co != null) available.add('competitors');
    if (mf != null) available.add('market_fit');
    if (cm != null) available.add('commercial');
    if (tr != null) available.add('traffic');
    if (fr != null) available.add('freshness');

    const eff = renormaliseWeights(weights, available);

    let score = 0;
    if (ed != null) score += eff.editorial   * ed;
    if (co != null) score += eff.competitors * co;
    if (mf != null) score += eff.market_fit  * mf;
    if (cm != null) score += eff.commercial  * cm;
    if (tr != null) score += eff.traffic     * tr;
    if (fr != null) score += eff.freshness   * fr;

    const boost = config.boost?.[casino.slug] ?? 1;
    if (boost !== 1) score *= boost;
    score = Math.max(0, Math.min(10, score));

    return {
      position: 0, // assigned after sort
      casino_slug: casino.slug,
      final_score: Number(score.toFixed(3)),
      is_featured: config.featured.includes(casino.slug),
      is_boosted: boost !== 1,
      inputs,
      used_inputs: Array.from(available),
      effective_weights: eff,
    };
  });

  // ---- 3) Sort by final score (descending). Featured promoted next. ----
  scored.sort((a, b) => b.final_score - a.final_score);

  // ---- 4) Promote featured slugs to the top in config order ----
  const featuredOrder = config.featured;
  if (featuredOrder.length > 0) {
    const featuredSet = new Set(featuredOrder);
    const featured: RankingPosition[] = [];
    const rest: RankingPosition[] = [];
    for (const p of scored) {
      if (featuredSet.has(p.casino_slug)) featured.push(p);
      else rest.push(p);
    }
    // Order featured per config slug order
    featured.sort(
      (a, b) => featuredOrder.indexOf(a.casino_slug) - featuredOrder.indexOf(b.casino_slug)
    );
    scored.length = 0;
    scored.push(...featured, ...rest);
  }

  // ---- 5) Assign positions, apply max_positions cap ----
  const limited = config.max_positions != null ? scored.slice(0, config.max_positions) : scored;
  return limited.map((p, idx) => ({ ...p, position: idx + 1 }));
}

/**
 * Helper — load editorial scores for a locale from a content collection.
 * Pages call this once and pass the map to computeRanking().
 */
export function buildEditorialMap(
  reviewEntries: CollectionEntry<'reviews'>[],
  localeCode: string,
): Map<string, { score: number; last_reviewed_at: Date }> {
  const out = new Map<string, { score: number; last_reviewed_at: Date }>();
  for (const r of reviewEntries) {
    if (r.data.locale !== localeCode) continue;
    out.set(r.data.casino, {
      score: r.data.score,
      last_reviewed_at: new Date(r.data.last_reviewed_at as unknown as string),
    });
  }
  return out;
}

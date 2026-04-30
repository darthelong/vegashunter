/**
 * Zod schemas for entities — single source of truth for shapes.
 * Build-time validation: anything failing parse breaks the build with a
 * helpful error pointing at the offending file.
 */
import { z } from 'zod';

// ---------- Casino (global entity) ----------
export const CasinoTagSchema = z.enum([
  'mobile_friendly',
  'live_casino',
  'crypto_friendly',
  'fast_payout',
  'high_roller',
  'new_casino',
  'low_wagering',
  'no_deposit_bonus',
  'paypal_accepted',
  'eu_licensed',
]);
export type CasinoTag = z.infer<typeof CasinoTagSchema>;

export const CasinoStatusSchema = z.enum(['active', 'inactive', 'blacklisted']);

export const CasinoSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case lowercase only'),
  brand_name: z.string().min(1),
  logo: z.string().startsWith('/'),
  established: z.number().int().min(1990).max(2050),
  owner: z.string().min(1),
  master_license: z.string().min(1),
  website: z.string().url(),
  providers: z.array(z.string()).default([]),
  tags: z.array(CasinoTagSchema).default([]),
  default_min_deposit: z.number().nonnegative().default(10),
  default_currency: z.string().length(3).default('EUR'),
  status: CasinoStatusSchema.default('active'),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Casino = z.infer<typeof CasinoSchema>;

// ---------- Affiliate Link ----------
export const AffiliateLinkSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  url: z.string().url(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
  /** Normalised commercial value 0–10. Used by ranking algorithm. PO updates per contract. */
  cpa_value: z.number().min(0).max(10).optional(),
  /** Map link to a casino slug (helps the ranking algorithm find the link for a casino). */
  casino: z.string().regex(/^[a-z0-9-]+$/).optional(),
});
export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;

export const AffiliateLinksFileSchema = z.array(AffiliateLinkSchema);

// ---------- Review (MDX frontmatter) ----------
export const ReviewModuleSchema = z.enum([
  'hero', 'verdict', 'bonus', 'games', 'payments', 'mobile', 'support',
  'license', 'scoring', 'faq', 'final_cta', 'ugc',
]);
export type ReviewModule = z.infer<typeof ReviewModuleSchema>;

export const FAQItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

export const ScoreBreakdownSchema = z.object({
  bonus:    z.number().min(0).max(10),
  games:    z.number().min(0).max(10),
  payments: z.number().min(0).max(10),
  support:  z.number().min(0).max(10),
  mobile:   z.number().min(0).max(10),
  trust:    z.number().min(0).max(10),
});

export const BonusFrontmatterSchema = z.object({
  amount:        z.number().nonnegative(),
  currency:      z.string().length(3),
  free_spins:    z.number().int().nonnegative().optional(),
  wagering:      z.number().int().nonnegative(),
  code:          z.string().optional(),
  max_bet:       z.number().nonnegative().optional(),
  validity_days: z.number().int().positive().optional(),
});

export const ReviewFrontmatterSchema = z.object({
  casino:               z.string().regex(/^[a-z0-9-]+$/),
  locale:               z.string().min(2),
  slug:                 z.string().regex(/^[a-z0-9-]+$/),
  title:                z.string().min(1),
  meta_title:           z.string().min(1),
  meta_description:     z.string().min(50).max(180),
  score:                z.number().min(0).max(10),
  score_breakdown:      ScoreBreakdownSchema,
  bonus:                BonusFrontmatterSchema,
  affiliate_link_id:    z.string().regex(/^[a-z0-9-]+$/),
  author:               z.string().min(1),
  published_at:         z.coerce.date(),
  last_reviewed_at:     z.coerce.date(),
  modules_enabled:      z.array(ReviewModuleSchema).min(1),
  faq:                  z.array(FAQItemSchema).default([])
                          .refine((arr) => arr.length === 0 || arr.length >= 3, {
                            message: 'FAQ section must have at least 3 questions when present',
                          }),
});
export type ReviewFrontmatter = z.infer<typeof ReviewFrontmatterSchema>;

// ---------- Author ----------
export const AuthorSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(40),
  avatar: z.string().startsWith('/'),
  same_as: z.array(z.string().url()).default([]),
});
export type Author = z.infer<typeof AuthorSchema>;

// ============================================================
// SPRINT 2 — RANKING ENGINE
// ============================================================

// ---------- External rating sources we trust ----------
// Locked in 2026-04-28 (PO decision): AskGamblers, Casino.guru, Trustpilot.
export const ExternalSourceSchema = z.enum([
  'askgamblers',
  'casino-guru',
  'trustpilot',
]);
export type ExternalSource = z.infer<typeof ExternalSourceSchema>;

/**
 * One entry per casino × source. Score is normalised to 0–10 (Trustpilot's 1–5
 * is doubled by the ingestion script). `as_of` lets the algorithm penalise
 * stale data later if we want.
 */
export const ExternalRatingEntrySchema = z.object({
  source: ExternalSourceSchema,
  score:  z.number().min(0).max(10),
  url:    z.string().url().optional(),
  reviews_count: z.number().int().nonnegative().optional(),
  as_of:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const ExternalRatingsFileSchema = z.object({
  casino:  z.string().regex(/^[a-z0-9-]+$/),
  ratings: z.array(ExternalRatingEntrySchema).default([]),
});
export type ExternalRatingsFile = z.infer<typeof ExternalRatingsFileSchema>;

// ---------- Semrush traffic data (manual export, free tier) ----------
export const SemrushDataSchema = z.object({
  domain:           z.string().min(3),
  /** Authority score (0–100) from the public Semrush top list. Optional. */
  authority_score:  z.number().min(0).max(100).optional(),
  /** Monthly organic traffic estimate, integer. Optional. */
  organic_traffic:  z.number().int().nonnegative().optional(),
  /** Number of organic ranking keywords. Optional. */
  ranking_keywords: z.number().int().nonnegative().optional(),
  /** Source URL (where you copied the data from) — for audit. */
  source_url:       z.string().url().optional(),
  as_of:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type SemrushData = z.infer<typeof SemrushDataSchema>;

// ---------- Ranking weights (per ranking config, sum to 1.0) ----------
export const RankingWeightsSchema = z.object({
  editorial:   z.number().min(0).max(1).default(0.30),
  competitors: z.number().min(0).max(1).default(0.20),
  market_fit:  z.number().min(0).max(1).default(0.15),
  commercial:  z.number().min(0).max(1).default(0.15),
  traffic:     z.number().min(0).max(1).default(0.10),
  freshness:   z.number().min(0).max(1).default(0.10),
}).refine((w) => {
  const sum = w.editorial + w.competitors + w.market_fit + w.commercial + w.traffic + w.freshness;
  // Allow 0.01 tolerance for float rounding
  return Math.abs(sum - 1.0) < 0.01;
}, { message: 'Ranking weights must sum to 1.0 (±0.01)' });

export type RankingWeights = z.infer<typeof RankingWeightsSchema>;

// ---------- Ranking config (per locale × per ranking slug) ----------
export const RankingTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const RankingConfigSchema = z.object({
  slug:           z.string().regex(/^[a-z0-9-]+$/),
  locale:         z.string().min(2),
  tier:           RankingTierSchema,
  title:          z.string().min(1),
  meta_title:     z.string().min(1),
  meta_description: z.string().min(50).max(180),
  /** Optional MDX intro file (path relative to src/content/rankings/). Future use. */
  intro_path:     z.string().optional(),
  /** Filter casinos by required tags (ALL must match). */
  required_tags:  z.array(CasinoTagSchema).default([]),
  /** Boost relevance for casinos with these tags (currently informational only). */
  optional_tags:  z.array(CasinoTagSchema).default([]),
  /** Algorithm weights — overrides defaults if present. */
  weights:        RankingWeightsSchema.optional(),
  /** Slugs forced to the top of the ranking (in this order). Get a "FEATURED" badge. */
  featured:       z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
  /** Per-casino multipliers applied AFTER weighted scoring. {slug: multiplier}. */
  boost:          z.record(z.string().regex(/^[a-z0-9-]+$/), z.number().positive()).default({}),
  /** Slugs that must NEVER appear in this ranking. */
  exclude:        z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
  /** Hard cap on rendered positions (defaults to all matched). */
  max_positions:  z.number().int().positive().optional(),
});
export type RankingConfig = z.infer<typeof RankingConfigSchema>;

// ---------- Per-casino ranking position (output of the algorithm) ----------
export interface RankingPosition {
  position: number;          // 1, 2, 3, ...
  casino_slug: string;
  final_score: number;       // weighted final, post-boost, 0–10
  is_featured: boolean;
  is_boosted: boolean;
  /** Per-input contributions for transparency (sum-of-products = final_score, pre-boost) */
  inputs: {
    editorial:   number | null;
    competitors: number | null;
    market_fit:  number | null;
    commercial:  number | null;
    traffic:     number | null;
    freshness:   number | null;
  };
  /** Which inputs were actually used (others were dropped + weights renormalised). */
  used_inputs: string[];
  /** Effective weights after renormalisation (always sum to 1). */
  effective_weights: RankingWeights;
}

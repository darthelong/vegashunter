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
});
export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;

export const AffiliateLinksFileSchema = z.array(AffiliateLinkSchema);

// ---------- Review (MDX frontmatter) ----------
export const ReviewModuleSchema = z.enum([
  'hero',
  'verdict',
  'bonus',
  'games',
  'payments',
  'mobile',
  'support',
  'license',
  'scoring',
  'faq',
  'final_cta',
  'ugc',
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
  published_at:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  last_reviewed_at:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

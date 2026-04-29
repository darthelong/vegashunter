/**
 * Astro content collections — review + blog corpora.
 *
 * The frontmatter schema mirrors src/lib/schemas.ts but is expressed via
 * astro:content's `z` so Astro picks it up. Build fails (with the offending
 * file path) when an MDX entry violates the schema.
 */
import { defineCollection, z } from 'astro:content';

const ReviewModule = z.enum([
  'hero', 'verdict', 'bonus', 'games', 'payments', 'mobile', 'support',
  'license', 'scoring', 'faq', 'final_cta', 'ugc',
]);

const FAQItem = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

const ScoreBreakdown = z.object({
  bonus:    z.number().min(0).max(10),
  games:    z.number().min(0).max(10),
  payments: z.number().min(0).max(10),
  support:  z.number().min(0).max(10),
  mobile:   z.number().min(0).max(10),
  trust:    z.number().min(0).max(10),
});

const Bonus = z.object({
  amount:        z.number().nonnegative(),
  currency:      z.string().length(3),
  free_spins:    z.number().int().nonnegative().optional(),
  wagering:      z.number().int().nonnegative(),
  code:          z.string().optional(),
  max_bet:       z.number().nonnegative().optional(),
  validity_days: z.number().int().positive().optional(),
});

const reviews = defineCollection({
  type: 'content',
  schema: z.object({
    casino:            z.string().regex(/^[a-z0-9-]+$/),
    locale:            z.string().min(2),
    title:             z.string().min(1),
    meta_title:        z.string().min(1),
    meta_description:  z.string().min(50).max(180),
    score:             z.number().min(0).max(10),
    score_breakdown:   ScoreBreakdown,
    bonus:             Bonus,
    affiliate_link_id: z.string().regex(/^[a-z0-9-]+$/),
    author:            z.string().min(1),
    published_at:      z.coerce.date(),
    last_reviewed_at:  z.coerce.date(),
    modules_enabled:   z.array(ReviewModule).min(1),
    faq:               z.array(FAQItem).default([]),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    locale:            z.string().min(2),
    title:             z.string().min(1),
    meta_title:        z.string().min(1),
    meta_description:  z.string().min(50).max(180),
    author:            z.string().min(1),
    published_at:      z.coerce.date(),
    last_reviewed_at:  z.coerce.date().optional(),
    category:          z.string().optional(),
    tags:              z.array(z.string()).default([]),
    hero_image:        z.string().optional(),
  }),
});

export const collections = { reviews, blog };

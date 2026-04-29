/**
 * Hand-rolled sitemap.xml.
 *
 * Why not @astrojs/sitemap: that integration's i18n config expects Astro's
 * built-in i18n routing — which we deliberately don't use because each locale
 * has translated path segments (reviews → bewertungen → reseñas → …) that
 * built-in fallback can't express. So we own the URL list and emit hreflang
 * annotations manually.
 *
 * Pages excluded from the sitemap:
 *   - /404
 *   - /{locale}/region-not-available/   (noindex, nofollow per geo-block UX)
 *
 * Hreflang behaviour:
 *   - Static pages (about, contact, ...) exist in every locale → emit alternates
 *     to all 11 locales + x-default → /en/.
 *   - Reviews exist only in locales where an MDX file is present for the same
 *     casino slug → emit alternates only to those locales.
 *   - Authors exist in every locale (the author page is generated for every
 *     locale × author combination).
 *
 * Rebuild touches the file every deploy. Last-modified pulls from review
 * frontmatter where available; otherwise the build timestamp.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { allLocales, SITE_URL, type Locale } from '@lib/locales';
import { allAuthors } from '@lib/authors';

export const prerender = true;

const STATIC_PAGES_PER_LOCALE = [
  '',                          // /{locale}/
  'about/',
  'contact/',
  'methodology/',
  'privacy-policy/',
  'terms-of-service/',
  'responsible-gambling/',
];

interface SitemapEntry {
  loc: string;
  lastmod: string;          // ISO date YYYY-MM-DD
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
  alternates: Array<{ hreflang: string; href: string }>;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildAlternates(
  resolveForLocale: (l: Locale) => string | undefined,
): SitemapEntry['alternates'] {
  const out: SitemapEntry['alternates'] = [];
  for (const l of allLocales()) {
    const path = resolveForLocale(l);
    if (path) out.push({ hreflang: l.hreflang, href: `${SITE_URL}${path}` });
  }
  // x-default → English version when present
  const en = allLocales().find((l) => l.is_x_default);
  if (en) {
    const enPath = resolveForLocale(en);
    if (enPath) out.push({ hreflang: 'x-default', href: `${SITE_URL}${enPath}` });
  }
  return out;
}

export const GET: APIRoute = async () => {
  const today = isoDate(new Date());
  const reviews = await getCollection('reviews');
  const reviewsByCasino = new Map<string, Map<string, typeof reviews[number]>>();
  for (const r of reviews) {
    let m = reviewsByCasino.get(r.data.casino);
    if (!m) {
      m = new Map();
      reviewsByCasino.set(r.data.casino, m);
    }
    m.set(r.data.locale, r);
  }

  const entries: SitemapEntry[] = [];

  // ---- Static pages × locales ----
  for (const locale of allLocales()) {
    for (const page of STATIC_PAGES_PER_LOCALE) {
      const path = `/${locale.code}/${page}`;
      entries.push({
        loc: `${SITE_URL}${path}`,
        lastmod: today,
        changefreq: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 1.0 : 0.5,
        alternates: buildAlternates((l) => `/${l.code}/${page}`),
      });
    }
  }

  // ---- Review index per locale ----
  for (const locale of allLocales()) {
    entries.push({
      loc: `${SITE_URL}/${locale.code}/${locale.paths.reviews}/`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.9,
      alternates: buildAlternates((l) => `/${l.code}/${l.paths.reviews}/`),
    });
  }

  // ---- Individual reviews ----
  for (const review of reviews) {
    const locale = allLocales().find((l) => l.code === review.data.locale);
    if (!locale) continue;
    const slug = (review as any).slug.replace(/^[^/]+\//, '');
    const path = `/${locale.code}/${locale.paths.reviews}/${slug}/`;
    const lastmod = isoDate(review.data.last_reviewed_at);
    const sameCasino = reviewsByCasino.get(review.data.casino) ?? new Map();
    entries.push({
      loc: `${SITE_URL}${path}`,
      lastmod,
      changefreq: 'monthly',
      priority: 0.8,
      alternates: buildAlternates((l) => {
        const r = sameCasino.get(l.code);
        if (!r) return undefined;
        const s = (r as any).slug.replace(/^[^/]+\//, '');
        return `/${l.code}/${l.paths.reviews}/${s}/`;
      }),
    });
  }

  // ---- Author pages × locales ----
  for (const locale of allLocales()) {
    for (const author of allAuthors()) {
      entries.push({
        loc: `${SITE_URL}/${locale.code}/authors/${author.slug}/`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.4,
        alternates: buildAlternates((l) => `/${l.code}/authors/${author.slug}/`),
      });
    }
  }

  // ---- Render XML ----
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map((e) => [
      '  <url>',
      `    <loc>${escapeXml(e.loc)}</loc>`,
      `    <lastmod>${e.lastmod}</lastmod>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority != null ? `    <priority>${e.priority.toFixed(1)}</priority>` : null,
      ...e.alternates.map(
        (a) => `    <xhtml:link rel="alternate" hreflang="${escapeXml(a.hreflang)}" href="${escapeXml(a.href)}" />`
      ),
      '  </url>',
    ].filter(Boolean).join('\n')),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};

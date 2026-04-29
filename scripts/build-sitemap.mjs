#!/usr/bin/env node
/**
 * Pre-build step: generate public/sitemap.xml.
 *
 * Why a script instead of an Astro endpoint:
 *   With trailingSlash: 'always' + format: 'directory', Astro emits
 *   `src/pages/sitemap.xml.ts` to `dist/sitemap.xml/index.html`, which CF
 *   Pages serves as text/html. The browser then treats <urlset> as unknown
 *   HTML and renders only the text content. Generating a literal file at
 *   build time bypasses every routing edge case — public/sitemap.xml gets
 *   copied verbatim to dist/sitemap.xml with Content-Type derived from the
 *   .xml extension.
 *
 * Reads:  data/locales.yaml, data/authors/*.yaml, src/content/reviews/{locale}/*.mdx
 * Writes: public/sitemap.xml (gitignored — regenerated every build)
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SITE_URL = 'https://vegashunter.pro';

// ---------------- Helpers ----------------
const today = new Date().toISOString().slice(0, 10);

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function readFrontmatter(path) {
  const raw = readFileSync(path, 'utf-8');
  // Strip leading whitespace, then split on '---' boundaries
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) throw new Error(`No frontmatter in ${path}`);
  return parseYaml(m[1]);
}

function listFiles(dir, ext) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => join(dir, f));
  } catch {
    return [];
  }
}

// ---------------- Load data ----------------
const locales = parseYaml(readFileSync(resolve(ROOT, 'data/locales.yaml'), 'utf-8'))
  .filter((l) => l.status === 'active');

const xDefault = locales.find((l) => l.is_x_default) ?? locales.find((l) => l.is_default) ?? locales[0];

const authors = listFiles(resolve(ROOT, 'data/authors'), '.yaml')
  .map((p) => parseYaml(readFileSync(p, 'utf-8')));

// Reviews — recurse src/content/reviews/{locale}/*.mdx
const reviews = [];
{
  const reviewsRoot = resolve(ROOT, 'src/content/reviews');
  for (const localeDir of readdirSync(reviewsRoot)) {
    const dirPath = join(reviewsRoot, localeDir);
    if (!statSync(dirPath).isDirectory()) continue;
    for (const file of listFiles(dirPath, '.mdx')) {
      const fm = readFrontmatter(file);
      const slugFromFile = file.split(/[\/\\]/).pop().replace(/\.mdx$/, '');
      reviews.push({
        casino: fm.casino,
        locale: fm.locale,
        slug: fm.slug ?? slugFromFile,
        last_reviewed_at: fm.last_reviewed_at ?? today,
      });
    }
  }
}

const reviewsByCasino = new Map();
for (const r of reviews) {
  if (!reviewsByCasino.has(r.casino)) reviewsByCasino.set(r.casino, new Map());
  reviewsByCasino.get(r.casino).set(r.locale, r);
}

// ---------------- Build URL list ----------------
const STATIC_PAGES_PER_LOCALE = [
  '',
  'about/',
  'contact/',
  'methodology/',
  'privacy-policy/',
  'terms-of-service/',
  'responsible-gambling/',
];

function buildAlternates(resolveForLocale) {
  const out = [];
  for (const l of locales) {
    const path = resolveForLocale(l);
    if (path) out.push({ hreflang: l.hreflang, href: `${SITE_URL}${path}` });
  }
  const xPath = resolveForLocale(xDefault);
  if (xPath) out.push({ hreflang: 'x-default', href: `${SITE_URL}${xPath}` });
  return out;
}

const entries = [];

// 1) Static pages × locales
for (const locale of locales) {
  for (const page of STATIC_PAGES_PER_LOCALE) {
    entries.push({
      loc: `${SITE_URL}/${locale.code}/${page}`,
      lastmod: today,
      changefreq: page === '' ? 'weekly' : 'monthly',
      priority: page === '' ? 1.0 : 0.5,
      alternates: buildAlternates((l) => `/${l.code}/${page}`),
    });
  }
}

// 2) Review index per locale
for (const locale of locales) {
  entries.push({
    loc: `${SITE_URL}/${locale.code}/${locale.paths.reviews}/`,
    lastmod: today,
    changefreq: 'weekly',
    priority: 0.9,
    alternates: buildAlternates((l) => `/${l.code}/${l.paths.reviews}/`),
  });
}

// 3) Individual reviews
for (const review of reviews) {
  const locale = locales.find((l) => l.code === review.locale);
  if (!locale) continue;
  const sameCasino = reviewsByCasino.get(review.casino) ?? new Map();
  const lastmod = String(review.last_reviewed_at).slice(0, 10);
  entries.push({
    loc: `${SITE_URL}/${locale.code}/${locale.paths.reviews}/${review.slug}/`,
    lastmod,
    changefreq: 'monthly',
    priority: 0.8,
    alternates: buildAlternates((l) => {
      const r = sameCasino.get(l.code);
      return r ? `/${l.code}/${l.paths.reviews}/${r.slug}/` : undefined;
    }),
  });
}

// 4) Author pages × locales
for (const locale of locales) {
  for (const author of authors) {
    entries.push({
      loc: `${SITE_URL}/${locale.code}/authors/${author.slug}/`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.4,
      alternates: buildAlternates((l) => `/${l.code}/authors/${author.slug}/`),
    });
  }
}

// ---------------- Render XML ----------------
const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
];
for (const e of entries) {
  lines.push('  <url>');
  lines.push(`    <loc>${escapeXml(e.loc)}</loc>`);
  lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
  if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
  if (e.priority != null) lines.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
  for (const a of e.alternates) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${escapeXml(a.hreflang)}" href="${escapeXml(a.href)}" />`);
  }
  lines.push('  </url>');
}
lines.push('</urlset>');
lines.push('');

const out = resolve(ROOT, 'public/sitemap.xml');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join('\n'), 'utf-8');

console.log(`[build-sitemap] wrote ${out} (${entries.length} URLs)`);

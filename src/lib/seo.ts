/**
 * SEO helpers — hreflang resolution, schema.org JSON-LD builders.
 */

import { allLocales, SITE_URL, defaultLocale, xDefaultLocale, type Locale } from './locales';

export interface PageSEO {
  /** <title> — should already include site name where appropriate */
  title: string;
  /** <meta name="description"> */
  description: string;
  /** Canonical URL (absolute) — falls back to SITE_URL + path */
  canonical?: string;
  /** Override OG image (absolute URL) */
  ogImage?: string;
  /** "noindex,nofollow" or similar — default is "index,follow" */
  robots?: string;
  /** Optional published / modified ISO dates (for Article, Review, etc.) */
  publishedAt?: string;
  modifiedAt?: string;
}

/**
 * Build <link rel="alternate" hreflang="..."> tags for a page.
 *
 * @param resolveForLocale  Returns the path (e.g. "/de/") for a given locale,
 *                          or undefined if the page does not exist in that locale.
 *                          For most pages with 1:1 locale mirrors, return
 *                          buildPath(locale.code, segment, slug).
 */
export function alternateHrefs(
  resolveForLocale: (locale: Locale) => string | undefined,
): Array<{ hreflang: string; href: string }> {
  const out: Array<{ hreflang: string; href: string }> = [];
  for (const locale of allLocales()) {
    const path = resolveForLocale(locale);
    if (path) {
      out.push({ hreflang: locale.hreflang, href: `${SITE_URL}${path}` });
    }
  }
  const xPath = resolveForLocale(xDefaultLocale());
  if (xPath) {
    out.push({ hreflang: 'x-default', href: `${SITE_URL}${xPath}` });
  }
  return out;
}

/**
 * Build the global Organization JSON-LD. Inject in BaseLayout once per page.
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VegasHunter',
    url: SITE_URL,
    logo: `${SITE_URL}/brand/vegashunter-logo.svg`,
    description: 'Editorial directory of online casinos. Reviews, rankings, and methodology since 2026.',
    foundingDate: '2026',
    sameAs: [
      // Populate as social profiles come online
    ],
  };
}

/**
 * BreadcrumbList JSON-LD helper. Pass an ordered array of {name, url}.
 */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

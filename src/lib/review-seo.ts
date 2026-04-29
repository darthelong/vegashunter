/**
 * Review-specific JSON-LD builders.
 */
import type { Casino } from './schemas';

interface ReviewLDInput {
  url: string;
  casino: Casino;
  fm: {
    title: string;
    score: number;
    published_at: Date;
    last_reviewed_at: Date;
    meta_description: string;
  };
  authorName: string;
  siteUrl: string;
}

export function reviewJsonLd(input: ReviewLDInput) {
  const { url, casino, fm, authorName, siteUrl } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    url,
    name: fm.title,
    headline: fm.title,
    reviewBody: fm.meta_description,
    datePublished: fm.published_at.toISOString().slice(0, 10),
    dateModified: fm.last_reviewed_at.toISOString().slice(0, 10),
    itemReviewed: {
      '@type': 'Organization',
      name: casino.brand_name,
      url: casino.website,
      logo: `${siteUrl}${casino.logo}`,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: fm.score,
      bestRating: 10,
      worstRating: 0,
    },
    author: {
      '@type': 'Person',
      name: authorName,
      url: `${siteUrl}/en/authors/${slugifyAuthor(authorName)}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'VegasHunter',
      url: siteUrl,
      logo: `${siteUrl}/brand/vegashunter-logo.svg`,
    },
  };
}

export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.a,
      },
    })),
  };
}

function slugifyAuthor(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

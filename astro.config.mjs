// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://vegashunter.pro';

// Locale list and Sitemap hreflang map are kept in sync with data/locales.yaml.
// When you add a new locale: update both data/locales.yaml AND this file.
const LOCALES = [
  'en', 'en-ca', 'en-gb', 'en-ie',
  'de',
  'es', 'es-ar', 'es-mx',
  'pt', 'pt-br',
  'ru',
];

const HREFLANG_MAP = {
  'en':    'en',
  'en-ca': 'en-CA',
  'en-gb': 'en-GB',
  'en-ie': 'en-IE',
  'de':    'de',
  'es':    'es',
  'es-ar': 'es-AR',
  'es-mx': 'es-MX',
  'pt':    'pt',
  'pt-br': 'pt-BR',
  'ru':    'ru',
};

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },

  // Astro's built-in i18n integration is intentionally NOT used here.
  // We handle [locale] routing ourselves via dynamic routes + getStaticPaths,
  // because each locale has translated path segments (reviews → bewertungen,
  // resenas, ...) which Astro's i18n fallback can't express. The /  → /en/
  // redirect is handled by src/pages/index.astro.

  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: HREFLANG_MAP,
      },
      // Exclude the static "region not available" page from the sitemap —
      // search engines should not index it.
      filter: (page) => !page.includes('/region-not-available/'),
    }),
  ],

  vite: {
    server: {
      // Allow LAN access during dev (mobile testing on local network)
      host: true,
    },
  },
});

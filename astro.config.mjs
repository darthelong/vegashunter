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

  i18n: {
    defaultLocale: 'en',
    locales: LOCALES,
    routing: {
      prefixDefaultLocale: true,        // /en/, /de/, ... — never bare /
      redirectToDefaultLocale: true,    // / -> /en/
    },
    fallback: {
      'en-ca': 'en',
      'en-gb': 'en',
      'en-ie': 'en',
      'es-ar': 'es',
      'es-mx': 'es',
      'pt-br': 'pt',
    },
  },

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

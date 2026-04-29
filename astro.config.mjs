// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

const SITE = 'https://vegashunter.pro';

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
  //
  // @astrojs/sitemap was disabled in Sprint 0 deploy because its i18n config
  // path conflicts with our manual locale routing. Re-enabling it (or hand-
  // rolling sitemap.xml) is a Sprint 1 follow-up.

  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
  ],

  vite: {
    server: {
      // Allow LAN access during dev (mobile testing on local network)
      host: true,
    },
  },
});

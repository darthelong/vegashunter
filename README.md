# VegasHunter.pro

Editorial directory of online casinos. Press Ledger v0.2 identity. Astro 4 + TypeScript + Tailwind + MDX. Static output, host-agnostic.

> Status: **Sprint 0 — foundations**. Living scaffold. Sprint 1 starts the review engine.

---

## Getting started

```bash
nvm use            # node 22
npm install        # ~30s
npm run dev        # http://localhost:4321
```

| Script              | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`       | Astro dev server with HMR                                                    |
| `npm run build`     | Type-check (`astro check`) + production build to `./dist/`                   |
| `npm run preview`   | Serve the production build locally                                           |
| `npm run typecheck` | Just the type check                                                          |
| `npm run format`    | Prettier across `src/**`                                                     |

---

## Repository layout

```
.
├── astro.config.mjs            ← framework config (i18n, sitemap, mdx)
├── tailwind.config.mjs         ← Press Ledger v0.2 design tokens (mirror of brand/design-tokens.json)
├── tsconfig.json
├── package.json
├── .nvmrc                      ← node 22
├── .gitignore
├── .prettierrc.json
├── .env.example
│
├── brand/                      ← brand identity assets (philosophy, board, wordmark, tokens)
│   ├── vegashunter-philosophy.md
│   ├── vegashunter-brand-board.png
│   ├── vegashunter-logo.svg    ← wordmark only — graphic mark TBD by PO
│   ├── vegashunter-logo.png
│   ├── vegashunter-logo-onlight.png
│   └── design-tokens.json
│
├── docs/
│   └── vegashunter-docs.md     ← full project documentation (sprints, decisions)
│
├── data/                       ← single sources of truth
│   ├── locales.yaml            ← every locale + translated path segments
│   ├── blocked-countries.yaml
│   ├── casinos/                ← casino entities (Sprint 1)
│   ├── rankings/               ← ranking configs (Sprint 2)
│   └── affiliate-links.yaml    ← (Sprint 1)
│
├── i18n/                       ← UI strings, one JSON per locale
│   ├── en.json                 ← reference / completeness target for build validation
│   ├── de.json
│   ├── es.json   es-ar.json   es-mx.json
│   ├── pt.json   pt-br.json
│   ├── en-ca.json en-gb.json en-ie.json
│   └── ru.json
│
├── content/                    ← MDX content (reviews, blog posts) — Sprint 1+
│   ├── reviews/{locale}/
│   └── blog/{locale}/
│
├── public/
│   ├── fonts/                  ← self-hosted ttf (avoids Google Fonts CDN)
│   ├── favicon.svg
│   ├── robots.txt
│   └── _headers                ← Cloudflare Pages security/cache headers
│
├── functions/
│   └── _middleware.ts          ← CF Pages edge: geo-block via CF-IPCountry
│
└── src/
    ├── components/
    │   ├── Header.astro
    │   ├── Footer.astro
    │   ├── LanguageSwitcher.astro
    │   ├── RGWidget.astro
    │   ├── InlineDisclosure.astro
    │   ├── CookieConsent.astro    ← built, OFF via flag
    │   └── StaticPage.astro
    ├── layouts/
    │   └── BaseLayout.astro       ← <head>, hreflang, OG, schema Organization
    ├── lib/
    │   ├── locales.ts             ← locale registry (parses data/locales.yaml at build)
    │   ├── i18n.ts                ← t() helper + completeness validation
    │   ├── seo.ts                 ← hreflang + JSON-LD helpers
    │   └── flags.ts               ← feature flags
    ├── pages/
    │   ├── index.astro            ← / → /en/ redirect
    │   ├── 404.astro
    │   └── [locale]/
    │       ├── index.astro        ← locale homepage (placeholder until ranking — Sprint 2)
    │       ├── about.astro
    │       ├── contact.astro
    │       ├── privacy-policy.astro
    │       ├── terms-of-service.astro
    │       ├── responsible-gambling.astro
    │       ├── methodology.astro
    │       └── region-not-available.astro   ← served at 451 by middleware
    └── styles/
        └── global.css             ← Tailwind + @font-face + base + components layer
```

---

## How the system fits together

### Locales

`data/locales.yaml` is the single source of truth for every active locale. Each entry carries:

- `code` (e.g. `de`, `es-mx`)
- `hreflang` (e.g. `de`, `es-MX`)
- `paths` — translated URL path segments per content type (`reviews` → `bewertungen`, `recenzje`, `resenas`, ...). Use `buildPath(locale, segment, slug)` from `@lib/locales` everywhere — never hardcode.
- `currency_default`, `market_scope`, `status`

When you **add a locale**:

1. Append it to `data/locales.yaml` with all `paths` filled in.
2. Mirror it in `LOCALES` and `HREFLANG_MAP` in `astro.config.mjs`.
3. Create `i18n/{code}.json` containing **every key** from `i18n/en.json`. The build will fail if anything is missing — by design.

### UI strings

`@lib/i18n` loads every active locale at build time and validates completeness against `en.json`. Missing keys → build fail with the list. Use `t('key', { vars })` in `.astro` files via `withLocale(locale.code)` for terseness.

### Hreflang

`@lib/seo.alternateHrefs` builds the alternate set. Each page passes a resolver function: given a locale, return the path of this page in that locale, or `undefined` if it doesn't exist there. The language switcher consumes the same data — no orphan locales linked.

### Geo-block

`functions/_middleware.ts` runs at the CF Pages edge for every request. Reads `CF-IPCountry`. If the country is in the blocked list, fetches the static `/en/region-not-available/` page from `env.ASSETS` and returns it with **status 451** (Unavailable For Legal Reasons, RFC 7725). Static assets and the not-available page itself bypass the check.

Blocked countries (Sprint 0): **PL, US, AU, FR**. Source: `data/blocked-countries.yaml`. _The middleware currently inlines the codes — a pre-build step will generate from YAML in a follow-up sprint._

When migrating to offshore hosting, replace `_middleware.ts` with the host's equivalent (Nginx geoip2, Apache mod_geoip, Node/Express). The Astro build is host-agnostic.

### Cookie consent

Built but disabled via `FLAGS.COOKIE_CONSENT_ENABLED` in `@lib/flags`. We ship cookie-clean by default — fonts are self-hosted, no Google Fonts CDN, no analytics. Flip the flag once GA4 / pixels are introduced.

### SEO foundations

- **Schema.org Organization** — global JSON-LD in `BaseLayout`.
- **Hreflang** — emitted per-page, including `x-default` pointing at `/en/`.
- **Sitemap** — auto-generated by `@astrojs/sitemap` on build; excludes `/region-not-available/` per filter.
- **Canonical** — emitted on every page; pages can override.
- **OG/Twitter cards** — populated from layout props.

### Performance budget (egzekwowane od Sprint 1)

- LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1
- JS first-load ≤ 100KB · CSS ≤ 50KB · image asset ≤ 100KB

Astro SSG + minimal hydration + self-hosted, font-display:swap fonts get us most of the way. Subsetting fonts (Latin/Cyrillic only) is a follow-up: Bricolage / JetBrains TTFs are over budget at 90–115 KB and should drop to ~30–50 KB after subsetting.

### Accessibility

WCAG 2.1 AA baseline. `:focus-visible` uses ribbon-tinted outline. Skip-link on every page. Keyboard nav supported in `<details>`-based language switcher. Color contrast on `bone` over `ink` is 17.4:1 (well above AAA).

---

## Adding things

### A casino review (Sprint 1)

Sprint 1 will add the `Review` schema and the routing. Until then, this is a stub.

### A new locale

See "When you add a locale" above. Then `npm run build` — failures point you at the next missing piece.

### A blocked country

1. Append to `data/blocked-countries.yaml` (documentation source of truth).
2. Append the ISO code to `BLOCKED_COUNTRIES` in `functions/_middleware.ts` (until the YAML→JSON pre-build step lands).
3. Verify locally with `curl -H "cf-ipcountry: PL" http://localhost:4321/en/`.

---

## Deployment

### Cloudflare Pages (current)

1. Push to `main` (production) or `develop` (preview).
2. CF Pages picks up the build via Git integration. Build command: `npm run build`. Build output: `dist`. Functions directory: `functions`.
3. Custom domain `vegashunter.pro` is wired via Cloudflare DNS (already done).

### Offshore hosting (post-MVP)

Astro outputs static HTML. Any host that can serve static files works. Replace the `functions/_middleware.ts` geo-block with the host's equivalent (Nginx/Apache config or a Node middleware) — the rest of the build is host-agnostic.

Staging deploys MUST override `robots.txt` to disallow indexing — handled via per-environment headers / redirects on CF Pages.

---

## Repo and CI

- Repo: <https://github.com/darthelong/vegashunter>
- Branches: `main` (prod) · `develop` (staging) · `feat/*`, `fix/*` per task
- CI (TODO Sprint 0 follow-up): GitHub Actions that runs `npm ci && npm run build` on every PR + push.

---

## Open questions / TODOs (Sprint 0 follow-ups)

- [ ] Replace inlined `BLOCKED_COUNTRIES` in `functions/_middleware.ts` with a YAML→JSON pre-build step that reads `data/blocked-countries.yaml`.
- [ ] Subset fonts (Latin / Latin-Extended / Cyrillic) to drop each TTF below 60 KB.
- [ ] Generate `og-default.png` from the brand board crop (currently a 404 placeholder).
- [ ] Replace `favicon.svg` once Product Owner designs the graphic mark.
- [ ] Refine machine-translated locale bundles (es-ar/es-mx/pt-br/en-ca/en-gb/en-ie) with native review.
- [ ] GitHub Actions CI workflow.
- [ ] When Product Owner accepts the brand and Sprint 0 deploy lands on CF Pages: smoke-test geo-block from PL/US/FR/AU IPs.

---

## Brand

See `brand/vegashunter-philosophy.md` for the **Press Ledger** manifesto and `brand/vegashunter-brand-board.png` for the visual identity board. Tokens live in `brand/design-tokens.json`; Tailwind mirrors them in `tailwind.config.mjs`.

---

© 2026 VegasHunter. All rights reserved.

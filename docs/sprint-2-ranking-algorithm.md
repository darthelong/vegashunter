# Sprint 2 — Algorithmic Ranking · Design Proposal

**Status:** Draft, awaiting PO confirmation. **Author:** Claude. **Date:** 2026-04-28.

---

## Why algorithmic

Manual ordering at scale (11 locales × dozens of rankings × hundreds of casinos) breaks down on three dimensions: it's labour-intensive, hard to audit, and impossible to explain to readers (E-E-A-T cost). An algorithm fixes all three: each ranking is derived from a small number of inputs, the formula is in version control, and the methodology page can show readers exactly how a verdict landed.

The algorithm is a **decision aid, not a black box**. Editorial overrides and commercial slots remain available — but they sit on top of an explainable baseline, not in place of it.

---

## Inputs (per casino, per locale)

| # | Signal             | Range  | Source                                   | Updates  |
|---|--------------------|--------|------------------------------------------|----------|
| 1 | `editorial_score`  | 0–10   | Our review's overall score               | per review revision |
| 2 | `competitors_avg`  | 0–10   | Weighted mean of trusted external sites  | weekly (manual) → daily (scraped) |
| 3 | `traffic_score`    | 0–10   | Log-normalised Semrush organic / authority | monthly (manual export) → daily (API) |
| 4 | `market_fit`       | 0–10   | Boolean checks for the locale's market   | per review revision |
| 5 | `commercial_value` | 0–10   | Normalised partner CPA / RevShare        | per partner contract update |
| 6 | `freshness`        | 0–10   | Linear decay if last_reviewed_at > 6 months | per build |

### `competitors_avg` — which sites count

Configurable per locale, capped at five sources. Initial pool:

- **AskGamblers** — global, well-respected
- **Casino.guru** — global, with locale-specific subdirectories
- **Casinomeister** — global, slow-moving but conservative (good signal)
- **Trustpilot** — mapped 1–5 → 0–10, capped at the source's verified review count
- **+ one localised aggregator per market** (e.g., a DACH-focused publication for `de`, an LATAM aggregator for `es-mx`)

Each source carries a per-locale weight. If a source publishes no rating for a casino, it's dropped from the average — never imputed.

### `market_fit` — five-point checklist

Each item worth 2 points, summed:

- Accepts market currency (EUR, GBP, MXN, BRL, …)
- Localised UI in the market language
- Localised live chat / support
- Regulator compliant for the market (or transparently disclosed when not)
- Localised payment methods (e.g., PIX in BR, OXXO in MX, Skrill in DE)

Mechanically computed from the casino's `data/casinos/*.yaml` extended with a `markets` map.

### `commercial_value` — disclosed by design

Pulled from `data/affiliate-links.yaml` extended with `cpa_value` (normalised 0–10 across the active partner pool, recomputed per build). Featured slots and boosts are disclosed inline with a "PARTNER" or "FEATURED" badge — never hidden in the score.

### `freshness` — recency penalty

Linear from 10.0 (just published) to 0.0 (12+ months stale). Forces the editorial flywheel to keep reviews current.

---

## Final score

```
final = W_editorial   × editorial_score
      + W_competitors × competitors_avg
      + W_traffic     × traffic_score
      + W_market_fit  × market_fit
      + W_commercial  × commercial_value
      + W_freshness   × freshness
```

Weights sum to 1.0 and are configurable **per ranking**. Defaults:

| Weight                | Default |
|-----------------------|---------|
| `W_editorial`         | 0.30    |
| `W_competitors`       | 0.20    |
| `W_market_fit`        | 0.15    |
| `W_commercial`        | 0.15    |
| `W_traffic`           | 0.10    |
| `W_freshness`         | 0.10    |

**Tunable per locale.** A DE ranking might raise `W_market_fit` to 0.25 (regulator nuance matters more), an `es-mx` longtail might raise `W_traffic` (newer market, signal is more variable).

---

## Manual override layer

Per ranking config (`data/rankings/{locale}/{slug}.yaml`):

```yaml
slug: beste-mobile-casinos
locale: de
required_tags: [mobile_friendly]
weights:
  editorial:   0.35
  competitors: 0.20
  market_fit:  0.20
  commercial:  0.10
  traffic:     0.10
  freshness:   0.05

competitors_pool:
  - askgamblers
  - casino.guru
  - casinomeister
  - trustpilot

featured:                    # always render at the top, in this order
  - slotoro
  - kasyno_x

boost:                       # multiplier applied AFTER scoring
  high_converting_partner_z: 1.15

exclude:                     # never appear in this list
  - blacklisted_operator_a

intro: |
  (MDX intro to the ranking page)
```

The pipeline:

1. Filter the casino pool by `required_tags` and `exclude`.
2. For each remaining casino, compute the weighted final score.
3. Apply `boost` multipliers.
4. Sort descending.
5. Promote `featured` slugs to the top, preserving their order.
6. Render. Featured and boosted slots carry a visible badge.

---

## Phasing

### Phase 2A — manual ingestion (Sprint 2, ships first)

- PO maintains `data/external-ratings/{casino-slug}.yaml` (hand-pasted scores from competitors).
- PO maintains `data/semrush/{domain}.yaml` (monthly Semrush export pasted into YAML).
- Build-time computation. Each rebuild = recomputed rankings.
- Update cadence: weekly for ratings, monthly for traffic.

This ships Sprint 2 with no external dependencies. The algorithm is real; only the data ingestion is manual.

### Phase 2B — semi-automated scrape (Sprint 5+)

- Scheduled CF Cron Trigger (or external webhook) hits competitor sites' public listing pages, parses the HTML, updates the YAML files in a git PR.
- We respect each site's robots.txt; manual fallback for sites that disallow.
- Triggers rebuild on merge.

### Phase 2C — Semrush API (Sprint 6+ if budget allows)

- Paid Semrush plan unlocked (~120 USD/mo for Business).
- Programmatic queries for organic_traffic / authority_score / keyword_count.
- Daily refresh.

If Semrush stays out of budget, we fall back permanently to manual quarterly exports — the algorithm still works, just with stale traffic signals.

---

## Transparency (E-E-A-T)

Every ranking page links the methodology page. The methodology page explains the formula in plain language:

> *We weight six factors when ordering casinos in a ranking: our own review score (30%), the consensus of trusted competitor sites (20%), how well the casino fits the local market (15%), our commercial relationship (15%, always disclosed), traffic and authority signals (10%), and how recently we revisited the review (10%). Featured slots are paid placements and are clearly labeled. Boosted slots receive a small uplift, also disclosed. We never alter our editorial review score for commercial reasons — that score lives independently in the review itself.*

Each ranking page also shows the input scores per casino (in a "How we scored this list" reveal), so a reader who cares can audit the math. Few will. The rest get the credibility signal.

---

## Anti-gaming and audit

- Weights and overrides are git-tracked; every change is reviewed in a PR with a written reason.
- The methodology page version-stamps the formula (e.g. "Methodology v1.3 — effective 2026-04-28").
- The build emits a `dist/_ranking-audit.json` file with every casino's six input scores and final ranked position, for Sprint 5 monitoring.
- Manual overrides log a `reason` field in the YAML and surface it in the audit file.

---

## Decisions locked (PO, 2026-04-28)

| # | Question | Decision |
|---|---|---|
| 1 | Competitor pool | **AskGamblers · Casino.guru · Trustpilot.** Casinomeister dropped. One localised aggregator may be added per market when warranted. |
| 2 | Semrush | **Phase 2A only — free / manual exports.** No paid API. Algorithm runs on the public Semrush top-list data, refreshed manually as time allows. We may upgrade if the project earns it. |
| 3 | Default weights | **Accepted.** Editorial 30 / Competitors 20 / Market fit 15 / Commercial 15 / Traffic 10 / Freshness 10. Per-ranking override remains available. |
| 4 | Commercial value source | Extend `data/affiliate-links.yaml` with `cpa_value` (0–10 normalised) per link. PO updates at contract change. |
| 5 | Featured-slot transparency | **Inline "PARTNER" / "FEATURED" badge per card.** FTC/ASA-clean, E-E-A-T-aligned. We absorb any small CTR cost. |

---

## What I'd build for Sprint 2

- `src/lib/ranking.ts` — pure scoring function with full type safety
- `src/lib/ranking-audit.ts` — emits `_ranking-audit.json` at build
- `data/external-ratings/{casino}.yaml` — schema + Zod validation, sample data for Slotoro
- `data/semrush/{domain}.yaml` — schema for traffic / authority
- `src/pages/[locale]/[rankingSlug].astro` — Tier 2 longtail ranking page
- `src/pages/[locale]/index.astro` — refactor home → main ranking (Tier 1 per locale)
- `RankingLayout.astro` + `CasinoCard.astro` — UI components
- Methodology page content (currently a placeholder)

Estimated scope: same shape as Sprint 1 (review engine), maybe a touch lighter since the data structures are simpler than the 12 review modules.

---

*End of proposal · 2026-04-28*

# Sprint 2 — Content Onboarding

**Status:** Foundations ready. Need PO to either (a) allowlist `askgamblers.com` in CF
Capabilities so Claude can scrape, or (b) paste the casino lists per market.

**Date:** 2026-04-30

---

## What's ready

### 14 locales (was 11) — 3 new added 2026-04-30
- en, en-ca, en-gb, en-ie, **en-us** (new) — base + 4 regional variants (CA / GB / IE / US auto-redirect by IP)
- de, **de-at** (new), **de-ch** (new) — base + 2 regional variants (AT / CH auto-redirect)
- es, es-ar, es-mx
- pt, pt-br
- ru

### Geo-block updated
- **Active:** PL, AU, FR
- **Lifted 2026-04-30:** US (en-us locale activated)

### Ranking configs ready (7 markets)

| Locale  | Title                                   | Weights override                     |
| ------- | --------------------------------------- | ------------------------------------ |
| en      | Best Online Casinos 2026                | defaults                             |
| en-gb   | Best Online Casinos in the UK 2026      | market_fit ↑ (0.20), commercial ↓ (0.10) — UKGC trust signal |
| en-ca   | Best Online Casinos in Canada 2026      | defaults                             |
| en-us   | Best Online Casinos in the US 2026      | defaults                             |
| de      | Beste Online Casinos 2026               | market_fit ↑ (0.20), commercial ↓    |
| de-at   | Beste Online Casinos in Österreich 2026 | market_fit ↑ (0.20), commercial ↓    |
| de-ch   | Beste Online Casinos in der Schweiz 2026| market_fit ↑ (0.20), commercial ↓    |

All have empty `featured` / `boost` / `exclude` — to be populated as casinos arrive.

### Casinos in the system today
- **Slotoro** (only one). Reviews exist for `en` (Alex Morgan) and `de` (Peter Klaus).

---

## The egress block

I tried to fetch the seven AskGamblers pages you linked but Cloudflare Pages has
the workspace egress restricted to `*.anthropic.com` only. WebSearch works but
returns SEO digest snippets, not the full ranked top-10 lists.

**Two paths to unblock:**

### Path A — allowlist + I scrape (faster, ~30 min once allowlist is live)

In CF Pages dashboard → Settings → Capabilities → Add `askgamblers.com` and
`*.askgamblers.com` to the egress allowlist. Then I can:
1. Fetch all 7 pages
2. Extract top 10–15 casinos per market
3. Auto-generate `data/casinos/*.yaml` stubs with the correct `brand_name`,
   AskGamblers review URL → operator website, license info, providers.
4. Update each ranking config's `featured` / `order` based on AskGamblers ranking.

This is the highest-fidelity path. Risk: AskGamblers ToS — we're reading their
public page (the same way Googlebot does) but at scale, repeated. Politest move:
respect their robots.txt, throttle requests, only read the listing pages (not
the full review prose). I'll handle that.

### Path B — you paste the lists (no allowlist needed)

You visit each of the 7 pages, copy the top 10 casino names + their AskGamblers
URLs into the format below, paste here. I batch-create the casino YAMLs.

```
== /en/ (general top 10) ==
1. Casino Name | https://askgamblers.com/online-casinos/reviews/slug
2. ...

== /en-gb/ ==
1. ...
```

Faster for you to do once than for Claude to walk through Path A's
allowlist + scrape + verify.

---

## What I extracted from WebSearch (partial — verify)

These are casino names that surfaced in AskGamblers SEO snippets across the
seven searches I ran today. They are **candidates**, not a verified ranking.
None were ordered or scored in the snippets. PO should refine this list.

### Cross-market / EN general (likely top-tier globally)

- **Gamblezen Casino** — CasinoRank 9.0, player rating 9.8 (1060+ reviews) — also on DE page
- **SlotVibe Casino** — CasinoRank 8.55, AskGamblers Certificate of Trust
- **Tsars Casino** — Certificate of Trust
- **Stake Casino** — also on CH page (crypto-friendly)
- **Slotoro Casino** — already in our system
- **Oshi Casino** — also on CA page
- **Casino On Net** — also on CH page
- **CasinoCasino**
- **Campeonbet Casino**
- **Crypto Games.io Casino**
- **Rooli Casino**

### UK-specific (en-gb)

- **Queenplay Casino**
- **Dragonara Casino**
- **Slots Devil Casino**
- **Highbet Casino**
- **Electric Spins Casino**

### Canada-specific (en-ca, mostly Ontario)

- **BetRivers Casino Ontario** (iGaming Ontario regulated)
- **NEO.bet Casino Ontario** (iGaming Ontario regulated)
- **CanPlay Casino**
- **Yukon Gold Casino**
- **Lucky Days Casino**
- **Bitkinz Casino**
- **Axecasino**

### Germany-specific (de) — GGL licensed only

- **OnlineCasino Deutschland** (Schleswig-Holstein → migrating to GGL)

(WebSearch returned only one explicit GGL example. PO should confirm the rest of
the German top 5–10 from `https://www.askgamblers.com/de/online-casinos/laender/de`.)

### Austria-specific (de-at)

(No casino names surfaced in the AT search snippet — only regulator metadata
about Austria's monopoly ending in 2027.)

### Switzerland-specific (de-ch)

- **Wettigo Casino**
- **Casino On Net** (cross-market)
- **Stake Casino** (cross-market, crypto)

### US-specific (en-us)

- **Scores Casino** (NJ-licensed)
- **BetRivers Casino** (multi-state US)

(WebSearch surfaced regulator metadata for NJ/MI/PA but not specific top operators.)

---

## Casino YAML template

Here's what each `data/casinos/{slug}.yaml` looks like. Compare to
`data/casinos/slotoro.yaml` for a fully-filled example.

```yaml
slug: tsars                             # global ID, never rename, kebab-case
brand_name: Tsars Casino
logo: /casinos/tsars.svg                # place the SVG/PNG in public/casinos/
established: 2021                       # year operator launched
owner: Hollycorn N.V.                   # parent company per AskGamblers / about page
master_license: Curacao eGaming         # primary licence
website: https://tsarscasino.com        # operator's own site, NOT askgamblers URL
providers:
  - pragmatic
  - netent
  - evolution
tags:
  - mobile_friendly
  - live_casino
  - crypto_friendly
  - fast_payout
  - eu_licensed
default_min_deposit: 10
default_currency: EUR
status: active                          # set 'inactive' to hide from rankings
created_at: 2026-04-30                  # the date you added this entry
```

**Required fields:** `slug`, `brand_name`, `logo`, `established`, `owner`,
`master_license`, `website`, `created_at`. **Tags are optional but matter** —
the ranking algorithm uses them for `market_fit` (e.g., `eu_licensed` lifts EU
locale fit) and Tier 2 longtail rankings filter by them.

---

## What happens after a casino is added

1. The ranking algorithm picks it up automatically — no code change.
2. It appears in any locale's main ranking where the algorithm scores > zero.
3. It can be **featured** (pinned to the top of a specific ranking) by adding
   the slug to `data/rankings/{locale}/main.yaml` `featured: [...]`.
4. It can be **boosted** (post-score multiplier) via the `boost: {slug: 1.15}` map.
5. It can be **excluded** from a specific ranking via `exclude: [...]`.
6. To get a full review on the site, write
   `src/content/reviews/{locale}/{slug}.mdx` (template: `slotoro.mdx`).

Without a review the casino still appears in the ranking — the editorial input
just gets dropped from its formula and the remaining inputs renormalise.

---

## Tomorrow's workflow

PO has data tomorrow. Two options:

### If you go Path A (allowlist):
1. Add `askgamblers.com` to CF Capabilities allowlist
2. Tell me — I'll fetch all 7 pages, batch-create casino YAMLs, populate
   ranking configs. ~30 min of work.

### If you go Path B (manual paste):
1. Visit each of the 7 AskGamblers pages
2. Copy top 10 casino names + URLs into a single message here
3. I'll batch-create YAMLs from your list. ~10 min on my side once data arrives.

Either way, after that we write 2–3 reviews per locale (your stated target),
and the rankings light up with real data instead of just Slotoro.

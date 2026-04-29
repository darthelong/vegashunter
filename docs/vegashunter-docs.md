# VegasHunter.pro — Dokumentacja projektu

**Wersja:** 1.0  
**Status:** Draft pre-implementacyjny  
**Data:** 27 kwietnia 2026  
**Stakeholders:** Product Owner + Claude (development)

---

## Spis treści

1. [Cele i zakres projektu](#1-cele-i-zakres-projektu)
2. [Stack technologiczny i hosting](#2-stack-technologiczny-i-hosting)
3. [Architektura językowa i URL](#3-architektura-językowa-i-url)
4. [Model danych](#4-model-danych)
5. [Recenzje kasyn](#5-recenzje-kasyn)
6. [Rankingi](#6-rankingi)
7. [Pozostałe typy contentu (Content Hubs)](#7-pozostałe-typy-contentu-content-hubs)
8. [SEO](#8-seo)
9. [Compliance, bezpieczeństwo i prywatność](#9-compliance-bezpieczeństwo-i-prywatność)
10. [Linki afiliacyjne i tracking](#10-linki-afiliacyjne-i-tracking)
11. [Internacjonalizacja (i18n)](#11-internacjonalizacja-i18n)
12. [Persona redakcyjna](#12-persona-redakcyjna)
13. [Plan wdrożenia (sprinty)](#13-plan-wdrożenia-sprinty)
14. [Otwarte tematy do domknięcia w trakcie](#14-otwarte-tematy-do-domknięcia-w-trakcie)

---

## 1. Cele i zakres projektu

### 1.1 Czym jest VegasHunter.pro

Serwis afiliacyjny prezentujący rankingi i recenzje kasyn online. Generuje przychód z programów partnerskich operatorów kasyn. Główny ruch pozyskiwany organicznie z wyszukiwarek (SEO).

### 1.2 Główne cele

- Generowanie ruchu organicznego z wielu rynków geograficznych w wielu językach
- Konwersja ruchu na rejestracje/depozyty u partnerów afiliacyjnych
- Skalowalna struktura pozwalająca dodawać kolejne rynki, języki, kasyna i typy contentu bez przebudowy

### 1.3 Charakter projektu

- Realizowany w pełni autorsko (Product Owner + Claude jako developer)
- Treści dostarczane początkowo manualnie, docelowo wpinane przez API z dedykowanego softu klienta
- Brak panelu admina na start — treści jako pliki w repo (MDX + dane strukturalne)
- Strona pod silne pozycjonowanie — Core Web Vitals, schema.org, hreflang i E-E-A-T jako priorytety od dnia 1

### 1.4 Co poza zakresem (świadome wykluczenia)

- Comparison pages (Casino A vs Casino B)
- Kalkulatory i narzędzia (np. wagering calculator)
- Aplikacja mobilna
- Panel admina / CMS na start (do rozważenia w fazie 5+)

---

## 2. Stack technologiczny i hosting

### 2.1 Stack frontend / generator

| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| Framework | **Astro** | SSG-first, idealny pod treściowe SEO, natywne wsparcie i18n, partial hydration (mniej JS) |
| Język | **TypeScript** | Type safety dla skomplikowanego modelu danych (kasyna × locale × tagi) |
| Styling | **Tailwind CSS** | Szybki development, mały bundle, łatwa spójność design system |
| Treści | **MDX** | Treści jako pliki w repo, możliwość dynamicznych komponentów w treści, łatwa generacja przez API |
| Frontmatter / dane | **YAML** w MDX + osobne pliki YAML/JSON dla encji (kasyna, linki) |
| Schema/SEO | Native Astro + custom layouts dla schema.org JSON-LD |

### 2.2 Hosting

- **Faza developmentu:** Cloudflare Pages (zero kosztu, łatwy preview, szybki deploy z gita)
- **Faza produkcyjna:** offshore hosting Product Ownera (migracja po walidacji pierwszej wersji)
- **Wymóg architektoniczny:** kod musi pozostać agnostyczny względem hostingu (statyczne pliki + opcjonalne edge functions wymienne na server-side equivalents)

### 2.3 Repozytorium i deployment

- Git (GitHub lub własny)
- Branche: `main` (prod), `develop` (staging), feature branches per zadanie
- CI/CD: build + test + deploy na każdy push do `develop`/`main`
- Środowiska: dev (lokalne), staging (Cloudflare Pages preview), prod (offshore)

### 2.4 Brak baz danych na start

- Wszystkie treści jako pliki (MDX dla treści, YAML/JSON dla danych strukturalnych)
- Brak backendu, brak loginu, brak panelu admina
- W fazie 5+: integracja z softem klienta po API (zaciąganie treści przy buildzie lub on-demand przez ISR)

---

## 3. Architektura językowa i URL

### 3.1 Lista locale na start (MVP)

| Kod locale | Język | Rynek docelowy | URL prefix | Tier |
|---|---|---|---|---|
| `en` | English | Globalny + EN-row (default + x-default) | `/en/` lub `/` (root redirect → `/en/`) | full |
| `en-ca` | English | Kanada | `/en-ca/` | full |
| `en-gb` | English | Wielka Brytania | `/en-gb/` | full |
| `en-ie` | English | Irlandia | `/en-ie/` | full |
| `de` | Deutsch | Niemcy (DACH-default) | `/de/` | full |
| `es` | Español | Hiszpania (ES-default) | `/es/` | full |
| `es-ar` | Español | Argentyna | `/es-ar/` | full |
| `es-mx` | Español | Meksyk | `/es-mx/` | full |
| `pt` | Português | Portugalia (PT-default) | `/pt/` | full |
| `pt-br` | Português | Brazylia | `/pt-br/` | full |
| `ru` | Русский | Rosja / RU-row | `/ru/` | full |

**Konwencja:** główny język (de, es, pt) bez sufixu region. Dodatkowe rynki tego samego języka — z sufixem region (es-ar, es-mx). Furtka na przyszłość: `de-at`, `de-ch`, `pt-br` jest już użyty.

### 3.2 Tier locale

- **`full`** — pełen serwis: home, ranking, recenzje, blog, content hubs, tłumaczenia UI, polityka prywatności
- **`review-only`** (opcja przyszła, np. recenzja po fińsku bez serwisu fińskiego) — wymaga pełnego onboardingu jezyka (tłumaczenie UI strings, hreflang, language switcher), aby utrzymać "tip-top SEO". W praktyce: dodanie nowego języka zawsze pociąga tłumaczenie UI

**Decyzja:** nie wprowadzamy "lite locale" / mieszanki językowej. Każdy nowy język = pełny onboarding. Jeśli klient zlecił recenzję po fińsku, traktujemy to jako uruchomienie locale FI.

### 3.3 Schemat URL

```
vegashunter.pro/                                  → 301 → /en/
vegashunter.pro/en/                               → home EN (ranking globalny)
vegashunter.pro/en/reviews/slotoro/               → recenzja
vegashunter.pro/en/best-mobile-casinos/           → longtail ranking
vegashunter.pro/en/blog/how-to-choose-a-casino/   → artykuł
vegashunter.pro/en/providers/netent/              → strona providera
vegashunter.pro/en/slots/starburst/               → strona slotu
vegashunter.pro/en/payment-methods/paypal/        → strona metody płatności
vegashunter.pro/en/bonuses/no-deposit/            → strona bonusu
vegashunter.pro/en/authors/alex-morgan/           → strona autora

vegashunter.pro/de/                               → home DE
vegashunter.pro/de/reviews/slotoro-bewertung/     → recenzja DE (slug w języku!)
vegashunter.pro/de/beste-mobile-casinos/          → longtail ranking DE

vegashunter.pro/es/reviews/slotoro-resena/        → recenzja ES
vegashunter.pro/es-mx/reviews/slotoro-resena/     → recenzja MX (jeśli osobna)
```

### 3.4 Reguły slugów

- **Recenzje:** segment `/reviews/` (lub jego tłumaczenie per locale: `/recenzje/`, `/bewertungen/`, `/resenas/`) + slug w danym języku
- **Slug:** kebab-case, słowa kluczowe w języku locale (`slotoro-casino-bewertung`, nie `slotoro-casino-review` na DE)
- **Brak duplikatów:** każdy slug unikalny w obrębie locale; cross-locale powiązany przez `casino_slug` (globalny ID)
- **Stabilność:** slug raz opublikowany się nie zmienia (lub dodajemy 301 redirect)

### 3.5 Kanał EN globalny vs EN regionalne

- `/en/` → ranking i treści "globalne" (target: rest of world EN-speaking, brak konkretnego rynku); `hreflang="en"` + `hreflang="x-default"`
- `/en-ca/`, `/en-gb/`, `/en-ie/` → wersje regionalne, `hreflang="en-CA"` itd.
- Recenzje pod `/en/` to "wersja domyślna"; pod `/en-ca/` — wersja dedykowana dla Kanady (jeśli istnieje)
- Jeśli dla danego kasyna nie ma wersji `en-ca`, language switcher w `en-ca` nie pokazuje go w kanadyjskim wariancie (lub pokazuje fallback do `en` z odpowiednią notyfikacją — TBD)

---

## 4. Model danych

### 4.1 Encje główne

#### Casino (encja globalna)

Reprezentuje markę kasyna. Jeden rekord per marka, niezależnie od liczby recenzji.

```yaml
# data/casinos/slotoro.yaml
slug: slotoro                          # globalny ID, niezmienny
brand_name: Slotoro
logo: /casinos/slotoro.svg
established: 2022
owner: Hollycorn N.V.
master_license: Curacao eGaming
website: https://slotoro.com
providers: [pragmatic, netent, evolution, playngo, hacksaw]
tags:
  - mobile_friendly
  - live_casino
  - crypto_friendly
  - fast_payout
  - high_roller
  - new_casino
default_min_deposit: 10
default_currency: EUR
status: active                         # active | inactive | blacklisted
created_at: 2026-04-01
```

#### Review (encja per locale)

Każda recenzja = osobny plik MDX referencujący kasyno.

```yaml
# content/reviews/de/slotoro-bewertung.mdx (frontmatter)
---
casino: slotoro                        # ref do encji globalnej
locale: de
slug: slotoro-bewertung
title: "Slotoro Casino Bewertung 2026"
meta_title: "Slotoro Casino Test 2026 — Bonus, Spiele, Erfahrungen"
meta_description: "Unser ausführlicher Slotoro Casino Test..."
score: 8.7
score_breakdown:
  bonus: 9.0
  games: 8.5
  payments: 8.0
  support: 9.0
  mobile: 9.0
  trust: 8.5
bonus:
  amount: 500
  currency: EUR
  free_spins: 200
  wagering: 35
  code: WELCOME500
  max_bet: 5
  validity_days: 30
affiliate_link_id: slotoro-de          # ref do tabeli linków
author: alex-morgan
published_at: 2026-04-01
last_reviewed_at: 2026-04-15
modules_enabled:
  - hero
  - verdict
  - bonus
  - games
  - payments
  - mobile
  - support
  - license
  - scoring
  - faq
  - final_cta
faq:
  - q: "Ist Slotoro Casino seriös?"
    a: "..."
  - q: "Welche Zahlungsmethoden akzeptiert Slotoro?"
    a: "..."
---

(treść MDX)
```

#### Affiliate Link (osobna tabela)

Linki niezależne od recenzji, podmieniane bez edycji treści.

```yaml
# data/affiliate-links.yaml
- id: slotoro-de
  url: "https://track.partner.com/?campaign=slotoro&geo=de&sub1={clickid}"
  notes: "DE deal, EUR currency"
  active: true
- id: slotoro-global
  url: "https://track.partner.com/?campaign=slotoro"
  notes: "Universal link, all geos"
  active: true
- id: slotoro-mx
  url: "https://track.partner.com/?campaign=slotoro&geo=mx"
  active: true
```

Parametry click ID / sub ID dostarczane przez Product Ownera, podstawiane przy renderowaniu CTA.

#### Provider (encja globalna)

```yaml
slug: netent
name: NetEnt
logo: /providers/netent.svg
established: 1996
hq: Stockholm, Sweden
license: MGA, UKGC
top_games: [starburst, gonzos-quest, dead-or-alive]
tags: [slots, live_casino, jackpots]
```

#### Slot (encja globalna)

```yaml
slug: starburst
name: Starburst
provider: netent
rtp: 96.09
volatility: low
paylines: 10
reels: 5
release_date: 2012-11-12
features: [wilds, re-spins, both-ways-pays]
tags: [classic, low-volatility, popular]
```

#### Payment Method, Bonus Type — analogicznie

### 4.2 Relacje

```
Casino (1) ──< Reviews (N) per locale
Casino (N) ──< AffiliateLinks (M) per market
Casino (N) >──< Provider (M)            # gry providerów w kasynie
Casino (N) >──< PaymentMethod (M)       # metody płatności w kasynie
Ranking (1) ──< Casino (N)              # uporządkowana lista
Author (1) ──< Reviews (N) ──< BlogPosts (N)
```

### 4.3 Lokalizowane vs globalne pola

| Pole | Globalne | Per-locale |
|---|---|---|
| Brand name, logo, rok założenia, właściciel | ✓ | |
| Master licencja, providers (lista) | ✓ | |
| Tags (cechy techniczne) | ✓ | |
| Tytuł recenzji, meta opisy, treść | | ✓ |
| Score (może się różnić per rynek!) | | ✓ |
| Bonus amount/currency | | ✓ |
| Affiliate link ID | | ✓ (per locale lub per region) |

---

## 5. Recenzje kasyn

### 5.1 Filozofia

- Każda recenzja = unikalna treść per (kasyno × locale)
- Modułowa struktura: 12 bloków, każdy włączany/wyłączany per recenzja
- Treść w MDX = swoboda dodawania prozy między modułami
- Schema.org `Review` + `AggregateRating` na każdej recenzji

### 5.2 Moduły recenzji

| # | Moduł | Zawartość |
|---|---|---|
| 1 | **Hero** | Logo, nazwa, ocena ogólna, pasek info (rok, licencja, min depozyt, czas wypłaty), główny CTA z bonusem |
| 2 | **Quick Verdict** | TL;DR (3-4 zdania) + Pros/Cons (5+5) |
| 3 | **Bonus & Promotions** | Welcome, reload, cashback, free spins, kody, wagering, max bet, ważność |
| 4 | **Games & Software** | Liczba gier, kategorie, top dostawcy (logotypy), live casino, jackpoty |
| 5 | **Payments** | Tabela: metoda / depozyt / wypłata / czas / limity / waluty / crypto |
| 6 | **Mobile Experience** | App vs browser, OS, ocena UX |
| 7 | **Customer Support** | Kanały, godziny, języki, czas odpowiedzi |
| 8 | **Licensing & Security** | Licencja, audyty (eCOGRA, iTech), SSL, RG tools |
| 9 | **Score Breakdown** | Tabela: kategoria / waga / ocena (bonusy, gry, płatności, support, mobile, trust) |
| 10 | **FAQ** | 5-8 pytań (z FAQPage schema) |
| 11 | **Final Verdict + CTA** | Podsumowanie + duży CTA |
| 12 | **User Reviews (UGC)** | Komentarze i oceny userów (faza 4) |

Każdy moduł jest komponentem Astro/React. Brak modułu (np. brak appki) = nie renderujemy.

### 5.3 Disclosure inline

Nad każdą recenzją (i każdym rankingiem): krótki disclosure tłumaczony per locale, np. *"VegasHunter receives a commission when you sign up through links on this site. This does not affect our editorial scoring."* Wymóg ASA/FTC + boost E-E-A-T.

### 5.4 Schema.org markup

```json
{
  "@type": "Review",
  "itemReviewed": {
    "@type": "Organization",
    "name": "Slotoro Casino",
    "logo": "..."
  },
  "reviewRating": { "@type": "Rating", "ratingValue": 8.7, "bestRating": 10 },
  "author": { "@type": "Person", "name": "Alex Morgan", "url": "..." },
  "datePublished": "2026-04-01",
  "publisher": { "@type": "Organization", "name": "VegasHunter" }
}
```

Dodatkowo: `FAQPage` (z modułu FAQ), `BreadcrumbList`, `AggregateRating` (z UGC w fazie 4).

---

## 6. Rankingi

### 6.1 Filozofia

- Rankingi są **mieszane** (SEO + revenue): kolejność ustalana ręcznie z uwzględnieniem stawek partnerskich, ale uzasadniona merytorycznie
- Każdy ranking ma `featured` slot (1-3 boostowane pozycje na górze)
- System **oparty o tagi** kasyna — longtaile generujemy filtrując po tagach

### 6.2 Tier rankingów

#### Tier 1 — Główne rankingi per locale (start: wszystkie locale)

| Locale | URL | Tytuł |
|---|---|---|
| en | `/en/` (home) | "Best Online Casinos 2026 — Global Rankings" |
| en-ca | `/en-ca/` | "Best Online Casinos in Canada 2026" |
| en-gb | `/en-gb/` | "Best Online Casinos in the UK 2026" |
| en-ie | `/en-ie/` | "Best Online Casinos in Ireland 2026" |
| de | `/de/` | "Beste Online Casinos 2026" |
| es | `/es/` | "Mejores Casinos Online 2026" |
| es-ar | `/es-ar/` | "Mejores Casinos Online de Argentina 2026" |
| es-mx | `/es-mx/` | "Mejores Casinos Online de México 2026" |
| pt | `/pt/` | "Melhores Casinos Online 2026" |
| pt-br | `/pt-br/` | "Melhores Cassinos Online do Brasil 2026" |
| ru | `/ru/` | "Лучшие онлайн-казино 2026" |

#### Tier 2 — Longtail rankingi (start: 1-2 locale dla walidacji, np. EN i DE)

Standardowe top-konwertujące longtaile:
- `best-mobile-casinos` / `beste-mobile-casinos`
- `live-casino`
- `new-casinos` / `neue-casinos`
- `crypto-casinos` / `krypto-casinos`
- `paypal-casinos`
- `no-deposit-bonus` / `bonus-ohne-einzahlung`
- `fast-payout-casinos` / `schnelle-auszahlung`

**Cel:** zwalidować strukturę i know-how na 2 językach przed eksplozją.

#### Tier 3 — Pozostałe longtaile (start: TYLKO infrastruktura kodu)

Kod gotowy do dodania, ale treści nie generujemy. Dodanie longtaila tier 3 = wpis w configu (slug, tytuł, filtr tagów, ręczna kolejność top 10) + opcjonalna treść MDX. Bez nowego kodu.

Przykłady do rozważenia w przyszłości:
- Best $5 deposit casinos
- Best high roller casinos
- Casinos with [Provider]
- Best slots casinos
- Best blackjack casinos
- Best mobile slots
- Best [payment method] casinos x N

### 6.3 Konfiguracja rankingu

```yaml
# data/rankings/de/beste-mobile-casinos.yaml
slug: beste-mobile-casinos
locale: de
tier: 2
title: "Beste Mobile Casinos in Deutschland 2026"
meta_description: "..."
filter:
  required_tags: [mobile_friendly]
  optional_tags: [live_casino]
  status: active
order:                                  # manualna kolejność, override score
  - slotoro
  - kasyno_x
  - kasyno_y
featured:                               # boost na górze
  - slotoro
  - kasyno_x
intro: |
  (MDX z wstępem do rankingu)
methodology_link: /de/methodologie/
```

### 6.4 Karta kasyna w rankingu

- Logo
- Nazwa + score
- TL;DR (1-2 zdania) — może być re-used z modułu Verdict
- Bonus highlight
- 3 kluczowe atuty (z tagów)
- CTA "Visit Casino" (link aff)
- CTA "Read Review" (link wewn.)

### 6.5 Methodology page

`/{locale}/methodology/` — strona opisująca jak ustalamy ranking. Wymóg E-E-A-T. Linkowana z każdego rankingu.

---

## 7. Pozostałe typy contentu (Content Hubs)

### 7.1 Blog / artykuły poradnikowe

- `/en/blog/`, `/de/blog/`, etc.
- Kategorie + tagi
- Każdy post z autorem (persona), schema.org `Article`
- Internal linking do recenzji i rankingów
- Lead magnet inline (newsletter signup)

### 7.2 Strony providerów

- `/en/providers/netent/`
- Bio providera, top gier, lista kasyn z grami tego providera
- Schema.org `Organization`

### 7.3 Strony slotów

- `/en/slots/starburst/`
- RTP, volatility, paylines, features, demo embed (jeśli dostępny), kasyna z tym slotem
- Schema.org `Game`

### 7.4 Strony metod płatności

- `/en/payment-methods/paypal/`
- Jak działa, plusy/minusy, bezpieczeństwo, lista kasyn akceptujących

### 7.5 Strony bonusów

- `/en/bonuses/no-deposit/`
- Lista aktualnych ofert no-deposit, kody, wagering
- Bardzo silny longtail traffic

### 7.6 User reviews (UGC) — faza 4

- Komentarze + oceny (1-5 gwiazdek) na recenzjach kasyn
- Moderacja przed publikacją
- Schema.org `AggregateRating` agregujący oceny userów + naszą ocenę
- Anti-spam (Cloudflare Turnstile lub hCaptcha)

### 7.7 Newsletter — faza 4

- Signup widget na blogu, recenzjach, dedykowana strona
- Lead magnet (np. "Top 10 Casino Bonus Codes 2026" — PDF)
- Integracja z dostawcą (Mailchimp / Brevo / własny SMTP — TBD)
- Double opt-in (GDPR)

---

## 8. SEO

### 8.1 Foundations

- **Core Web Vitals:** LCP < 2.5s, INP < 200ms, CLS < 0.1 (Astro SSG to ułatwia)
- **Mobile-first:** wszystkie szablony projektowane mobile-first
- **HTTPS:** obowiązkowo
- **Brak duplicate content:** canonical na każdej stronie
- **Brak orphan pages:** każda strona linkowana wewnętrznie

### 8.2 Hreflang

Każda strona z odpowiednikami w innych locale renderuje pełen zestaw `<link rel="alternate" hreflang="...">`:

```html
<link rel="alternate" hreflang="x-default" href="https://vegashunter.pro/en/" />
<link rel="alternate" hreflang="en" href="https://vegashunter.pro/en/" />
<link rel="alternate" hreflang="en-CA" href="https://vegashunter.pro/en-ca/" />
<link rel="alternate" hreflang="de" href="https://vegashunter.pro/de/" />
<link rel="alternate" hreflang="es" href="https://vegashunter.pro/es/" />
...
```

Dla recenzji `/de/reviews/slotoro-bewertung/`: alternates do wszystkich locale, w których istnieje recenzja Slotoro.

### 8.3 Schema.org JSON-LD

Per typ strony:
- **Recenzja:** `Review`, `AggregateRating` (gdy są UGC), `BreadcrumbList`, `FAQPage` (gdy moduł FAQ)
- **Ranking:** `ItemList`, `BreadcrumbList`
- **Blog post:** `Article`, `BreadcrumbList`
- **Provider:** `Organization`, `BreadcrumbList`
- **Slot:** `Game` (lub `VideoGame`), `BreadcrumbList`
- **Author page:** `Person`
- **Organization (globalnie w layout):** `Organization` z logo, sameAs, contactPoint

### 8.4 Sitemap

- Jeden globalny `sitemap.xml` z linkami i hreflang annotations
- Lub rozbicie na per-locale sitemap + sitemap-index (bardziej skalowalne przy 1000+ stron)
- Auto-generacja przy buildzie

### 8.5 Robots.txt

- Allow all
- Wskazanie sitemap
- Blokada dev/staging środowisk (osobny robots na staging)

### 8.6 Internal linking

- Recenzje linkują do rankingów, providerów, slotów, metod płatności
- Rankingi linkują do recenzji
- Blog linkuje do rankingów, recenzji, providerów (kontekstowo)
- Footer: linki do głównych rankingów, polityki, autorów

### 8.7 E-E-A-T (krytyczne dla YMYL)

- Strony autorów z bio i social proof
- Methodology page wyjaśniająca ranking
- About / Editorial policy
- Disclosure afiliacyjny (footer + inline)
- Daty publikacji + last updated
- Kontakt

### 8.8 Breadcrumbs

Na każdej stronie poza home:
```
Home > Reviews > Slotoro Casino Review
Home > Best Mobile Casinos
Home > Blog > How to choose a casino
```

Renderowane wizualnie + schema `BreadcrumbList`.

---

## 9. Compliance, bezpieczeństwo i prywatność

### 9.1 Geo-blocking

**Cel:** automatyczne blokowanie krajów z całkowitym zakazem hazardu online lub wymagających lokalnej licencji, której nie chcemy mieć (np. Polska).

**Implementacja:**
- Lista zablokowanych krajów w configu: `data/blocked-countries.yaml`
- Detekcja po nagłówku `CF-IPCountry` (Cloudflare) lub równoważnym na hostingu docelowym
- Edge function / middleware sprawdza kod kraju przed renderem
- Z zablokowanego kraju: prosta strona "Service not available in your region" (statyczna, 451 status code)
- Log statystyk (ile prób z którego kraju) — opcjonalnie

**Lista startowa (do uzgodnienia):**
- PL (Polska — całkowity zakaz promocji bez polskiej licencji)
- (TBD: konkretną listę dostarcza Product Owner przy starcie fazy 0)

### 9.2 Responsible Gambling

- Widget RG w stopce (ikony 18+, GamCare, BeGambleAware, GamblersAnonymous, etc. per locale)
- Strona `/{locale}/responsible-gambling/` z informacjami o limitach, self-exclusion, helplines
- Linki RG przy każdym CTA afiliacyjnym (subtelne, ale obecne)

### 9.3 Disclosure afiliacyjny

- **Stopka:** stała informacja
- **Inline:** krótki disclosure nad każdym rankingiem i nad/pod CTA w recenzjach
- Tłumaczone per locale

### 9.4 Cookie consent

- **Status na start:** off (Product Owner decyzja)
- **Implementacja:** moduł zaprojektowany, ale wyłączony przez feature flag
- **Aktywacja:** włącznie z aktywacją GA4 i jakichkolwiek pixeli
- **Charakter:** GDPR-compliant, blokuje skrypty trackingowe do zaakceptowania

### 9.5 Polityka prywatności i regulamin

- `/{locale}/privacy-policy/` i `/{locale}/terms-of-service/`
- **Start:** 1 wersja po angielsku, podlinkowana ze wszystkich locale
- **Docelowo:** tłumaczenia per locale (faza 3-4)
- Treść dostarcza Product Owner / prawnik (placeholder na start)

### 9.6 Age gate

- Banner 18+ w hero/footer
- Brak full age gate na start (wpływ na bounce rate); reaktywujemy jeśli wymóg licencyjny

### 9.7 Bezpieczeństwo

- HTTPS wymuszone (HSTS)
- Brak formularzy z danymi wrażliwymi (poza newsletterem — tylko email)
- Brak loginu userów na start (UGC bez kont — moderowane przez nas)
- Anti-spam na komentarzach (faza 4): Cloudflare Turnstile

---

## 10. Linki afiliacyjne i tracking

### 10.1 Zarządzanie linkami

- Wszystkie linki w jednym pliku: `data/affiliate-links.yaml`
- Każdy link ma unikalny ID, URL, status (active/inactive), notes
- Recenzje i karty rankingu referencują link po ID — zmiana URL = edycja jednego pliku, propagacja wszędzie
- Możliwość różnych linków per (kasyno × locale) lub jeden uniwersalny — decyzja per kasyno

### 10.2 Parametry tracking

- Click ID, sub ID, source itp. dostarcza Product Owner per link
- Podstawiane przy renderowaniu (template `{clickid}` zastępowany dynamicznie lub statycznie)
- Sub IDs mogą zawierać kontekst: `sub1=review|ranking-de|blog`, `sub2={page-slug}` (do raportowania)

### 10.3 Cloaking / redirect (opcja przyszła)

- Możliwość ukrycia bezpośrednich linków afiliacyjnych za `/go/{casino-slug}` redirectami
- Zaleta: kontrola, statystyki, łatwa wymiana linków, "czystszy" wygląd
- **Decyzja na start:** linki bezpośrednie (prostsze); cloaking dodajemy jeśli będzie potrzeba

### 10.4 Analityka

- **GA4:** jedna property dla całego serwisu, segmentacja po `page_locale` i `page_type`
- **Google Search Console:** jedna property (Domain Property), automatycznie obejmuje wszystkie locale
- **Click tracking:** GA4 events na każdy klik affiliate (event `affiliate_click` z parametrami: `casino_slug`, `link_id`, `page_type`, `locale`)
- **Bing Webmaster Tools:** dodać po starcie

---

## 11. Internacjonalizacja (i18n)

### 11.1 UI strings

- Centralna lokalizacja: `i18n/{locale}.json`
- Klucze: `nav.home`, `cta.read_review`, `bonus.wagering`, `breadcrumbs.home`, ...
- **Wymóg:** dodanie nowego locale = dostarczenie wszystkich kluczy (build fail, jeśli brak)

### 11.2 Locale registry

```yaml
# data/locales.yaml
- code: en
  name: English
  hreflang: en
  is_default: true
  is_x_default: true
  market_scope: global
  currency_default: USD
  status: active
- code: de
  name: Deutsch
  hreflang: de
  market_scope: dach
  currency_default: EUR
  status: active
- code: es-mx
  name: Español (México)
  hreflang: es-MX
  market_scope: mx
  currency_default: MXN
  status: active
```

### 11.3 Language switcher

- W headerze, widoczny ze wszystkich stron
- Pokazuje tylko locale, w których istnieje aktualny URL (czyli mamy odpowiednik)
- Jeśli nie ma odpowiednika — link do home tego locale (lub ukryty)

### 11.4 Tłumaczenia segmentów URL

- `/reviews/` może być `/recenzje/`, `/bewertungen/`, `/resenas/`, `/avaliacoes/`, `/обзоры/` per locale
- Mapping w configu locale, generowany routing per locale
- Stabilny: raz wybrany segment się nie zmienia bez 301

### 11.5 Walidacja

- Build fail, jeśli któraś recenzja referencjonuje nieistniejące casino_slug
- Build fail, jeśli któryś ranking referencjonuje nieistniejące casino_slug
- Build fail, jeśli locale ma niekompletne tłumaczenia UI strings

---

## 12. Persona redakcyjna

### 12.1 Alex Morgan

- **Imię i nazwisko:** Alex Morgan
- **Rola:** Senior Casino Reviewer / Affiliate Manager
- **Bio (draft do dopracowania):** Affiliate manager z 15-letnim doświadczeniem w branży. Pracował w wiodących sieciach afiliacyjnych. Aktywny uczestnik konferencji branżowych (iGB Affiliate, SiGMA, ICE London). Specjalizuje się w analizie ofert kasyn i programów partnerskich.
- **Avatar:** AI-generated, styl anime (do wygenerowania w fazie 1)
- **Strona autora:** `/{locale}/authors/alex-morgan/` — bio, lista recenzji i artykułów, social proof (linki do branżowych profili — TBD)

### 12.2 Plan rozbudowy

- Możliwość dodania kolejnych person redakcyjnych w przyszłości (np. specjalistka od slotów, ekspert od live casino)
- Każda persona = osobna strona autora, własne recenzje/artykuły
- Schema.org `Person` + `sameAs` do profili branżowych

---

## 13. Plan wdrożenia (sprinty)

**Założenia:** sprinty nie mają sztywnego czasu. Każdy sprint = logiczna paczka funkcjonalności. Po każdym sprincie — review z Product Ownerem, ewentualne korekty, zatwierdzenie przed kolejnym.

---

### Sprint 0 — Fundamenty i infrastruktura

**Cel:** Postawić szkielet projektu, na którym da się budować. Zero treści, ale działający routing, layout, i18n, geo-block.

**Zadania:**

1. **Setup repozytorium**
   - Inicjalizacja Astro + TypeScript + Tailwind + MDX
   - Struktura katalogów (`/content`, `/data`, `/i18n`, `/src/components`, `/src/layouts`, `/src/pages`)
   - Konfiguracja git (`.gitignore`, README.md startowy)
   - Konfiguracja CI/CD na Cloudflare Pages (preview deploys)

2. **Locale registry i routing**
   - Plik `data/locales.yaml` z wszystkimi locale na MVP
   - Astro i18n config (default `en`, prefixy locale)
   - Root redirect `/` → `/en/`
   - 404 page per locale + globalna fallback

3. **Globalny layout**
   - Komponent `Header` (logo, language switcher, primary nav)
   - Komponent `Footer` (linki main, polityki, RG widget, disclosure, social)
   - System "blocks" w headerze/footerze — edycja w jednym miejscu propaguje wszędzie
   - Mobile menu (hamburger)

4. **i18n strings infrastructure**
   - Pliki `i18n/{locale}.json` ze wszystkimi kluczami UI
   - Helper `t(key, locale)` w komponentach
   - Walidacja build-time: brak klucza w którymś locale = błąd

5. **Geo-blocking module**
   - `data/blocked-countries.yaml`
   - Edge function / middleware na Cloudflare (sprawdzanie `CF-IPCountry`)
   - Strona "not available in your region" (statyczna, multilang)
   - Logika: zablokowany kraj → 451 + statyczna strona

6. **Cookie consent (zaprojektowany, off)**
   - Komponent banner GDPR-compliant
   - Feature flag `COOKIE_CONSENT_ENABLED` (default false)
   - Dokumentacja: jak włączyć

7. **Responsible Gambling widget**
   - Komponent w stopce z ikonami (GamCare, BeGambleAware, 18+, etc.)
   - Tłumaczone per locale

8. **Affiliate disclosure**
   - Globalny disclosure w stopce
   - Komponent `<InlineDisclosure />` do użycia w recenzjach/rankingach (faza 1+)

9. **Strony statyczne (placeholder EN)**
   - `/en/privacy-policy/` (placeholder)
   - `/en/terms-of-service/` (placeholder)
   - `/en/responsible-gambling/` (treść startowa)
   - `/en/about/` (placeholder)
   - `/en/contact/` (placeholder)

10. **SEO foundations**
    - `<Head>` layout: meta tags, OG tags, Twitter cards, canonical, hreflang
    - `robots.txt` (prod/staging różne)
    - `sitemap.xml` (auto-generacja)
    - Schema.org `Organization` w globalnym layoucie

11. **Deployment testowy**
    - Pierwszy deploy na Cloudflare Pages
    - Weryfikacja: routing, hreflang, geo-block na testowym IP

**Deliverable:** Działający szkielet z home pages w każdym locale (placeholder content), działający geo-block, działający language switcher, poprawne hreflang, sitemap.

---

### Sprint 1 — Review Engine

**Cel:** Pełen system recenzji. Możliwość dodania nowej recenzji = napisać MDX + dane.

**Zadania:**

1. **Schema danych**
   - YAML schema dla `Casino` (`data/casinos/*.yaml`)
   - YAML schema dla `AffiliateLink` (`data/affiliate-links.yaml`)
   - MDX frontmatter schema dla recenzji
   - TypeScript types + walidacja (Zod) build-time

2. **Routing recenzji**
   - Dynamic route `/{locale}/{review_segment}/{slug}/` (`reviews`, `recenzje`, `bewertungen`...)
   - Auto-discover MDX files w `content/reviews/{locale}/`
   - 404 jeśli slug nie istnieje w danym locale

3. **Layout recenzji**
   - Bazowy layout `ReviewLayout.astro`
   - Hero section z bonusem i CTA
   - Sidebar z TOC (table of contents) — sticky na desktopie
   - Author byline + last updated

4. **12 modułów recenzji**
   - Komponenty: `ReviewHero`, `QuickVerdict`, `BonusModule`, `GamesModule`, `PaymentsModule`, `MobileModule`, `SupportModule`, `LicenseModule`, `ScoreBreakdown`, `FAQModule`, `FinalCTA`, `UGCPlaceholder`
   - Każdy moduł włączany przez `modules_enabled` w frontmatter
   - Każdy moduł z własnymi propsami z frontmatter

5. **Schema.org dla recenzji**
   - `Review` JSON-LD
   - `FAQPage` (gdy moduł FAQ)
   - `BreadcrumbList`
   - Walidacja przez Google Rich Results Test

6. **Breadcrumbs**
   - Komponent `Breadcrumbs.astro` (visual + schema)
   - Auto-build na podstawie URL

7. **Strona autora**
   - Layout `AuthorLayout.astro`
   - Strona `/{locale}/authors/alex-morgan/` (bio, lista recenzji, social)
   - Avatar Alex Morgan (AI-generated anime style)
   - Schema.org `Person`

8. **Inline disclosure**
   - Renderowany na każdej recenzji nad CTA
   - Tłumaczony per locale

9. **Affiliate link rendering**
   - Helper `getAffiliateLink(linkId, params)` z podstawianiem click ID, sub ID
   - GA4 event `affiliate_click`
   - `rel="nofollow sponsored"` na każdym CTA aff

10. **Pierwsze recenzje end-to-end**
    - 1 recenzja w EN (z prawdziwą treścią startową od Product Ownera)
    - 1 recenzja w DE (analogicznie)
    - Walidacja: hreflang, schema, breadcrumbs, CTA, mobile

**Deliverable:** Działający system recenzji. Dodanie nowej recenzji = stworzenie MDX + wpis w `casinos.yaml`. Pierwsze 2 recenzje live (EN+DE).

---

### Sprint 2 — Rankings Engine

**Cel:** Pełen system rankingów. Główne rankingi per locale + framework dla longtaili.

**Zadania:**

1. **Schema rankingu**
   - YAML schema dla `Ranking` (`data/rankings/{locale}/*.yaml`)
   - Pola: slug, title, meta, filter (tagi), order (manual), featured, intro (MDX)
   - TypeScript types + walidacja

2. **Routing rankingów**
   - Tier 1: `{locale}/` (homepage = główny ranking) lub osobny URL? **Decyzja TBD** — sugeruję home = ranking główny dla SEO ("best online casinos {region}")
   - Tier 2: `/{locale}/{ranking_slug}/`
   - Auto-discover

3. **Layout rankingu**
   - Layout `RankingLayout.astro`
   - Header z H1, intro
   - Disclosure inline
   - Lista kart kasyn
   - Linki do methodology, FAQ, related rankings

4. **Karta kasyna w rankingu**
   - Komponent `CasinoCard.astro`
   - Logo, nazwa, score, TL;DR, bonus highlight, 3 atuty z tagów, 2 CTA (Visit + Read Review)
   - Wariant `featured` (większy, z badgem)
   - Mobile-optimized

5. **Filter + sort engine**
   - Funkcja `getRankingCasinos(rankingConfig)`:
     - Filtruje kasyna po required_tags
     - Sortuje wg manual order (z `order` w configu)
     - Wstawia featured na górze
     - Wyklucza inactive/blacklisted
   - Walidacja: każdy slug w `order` musi istnieć w `casinos.yaml`

6. **Schema.org dla rankingu**
   - `ItemList` z pozycjami kasyn
   - `BreadcrumbList`

7. **Methodology page**
   - `/{locale}/methodology/` — jak budujemy ranking
   - Linkowane z każdego rankingu

8. **Tier 1 rankingi (wszystkie locale)**
   - Główne rankingi z prawdziwą treścią (10-15 kasyn każdy)
   - Treści dostarczone przez Product Ownera
   - EN, en-ca, en-gb, en-ie, de, es, es-ar, es-mx, pt, pt-br, ru

9. **Tier 2 rankingi (start: EN i DE)**
   - 3-5 longtail rankingów na każdy z 2 walidacyjnych języków
   - Sprawdzenie, że framework działa (filtry tagów, manual order, featured)

10. **Tier 3 — sama infrastruktura**
    - Framework gotowy: dodanie rankingu = wpis w configu + opcjonalna treść
    - Bez generacji treści (zgodnie z decyzją)

**Deliverable:** Wszystkie tier 1 rankingi live. Tier 2 (5 longtaili na EN, 5 na DE) live. Tier 3 ready-to-add.

---

### Sprint 3 — Content Hubs

**Cel:** Blog, providery, sloty, payment methods, bonusy. Internal linking ekosystemu.

**Zadania:**

1. **Blog**
   - Schema: `BlogPost` (frontmatter: title, slug, locale, author, category, tags, published_at, hero_image)
   - Routing: `/{locale}/blog/`, `/{locale}/blog/{slug}/`
   - Layout artykułu
   - Strony kategorii i tagów
   - RSS feed per locale
   - Schema.org `Article`

2. **Providery**
   - Schema: `Provider` (`data/providers/*.yaml`)
   - Routing: `/{locale}/providers/`, `/{locale}/providers/{slug}/`
   - Layout: bio, top gier, kasyna z grami
   - Schema.org `Organization`

3. **Sloty**
   - Schema: `Slot` (`data/slots/*.yaml`)
   - Routing: `/{locale}/slots/`, `/{locale}/slots/{slug}/`
   - Layout: RTP, volatility, features, demo embed (jeśli dostępny), kasyna z slotem
   - Schema.org `Game`

4. **Payment methods**
   - Schema: `PaymentMethod` (`data/payment-methods/*.yaml`)
   - Routing: `/{locale}/payment-methods/`, `/{locale}/payment-methods/{slug}/`
   - Layout: opis, plusy/minusy, lista kasyn

5. **Bonus pages**
   - Schema: `BonusType` (`data/bonus-types/*.yaml`)
   - Routing: `/{locale}/bonuses/`, `/{locale}/bonuses/{slug}/`
   - Layout: lista aktualnych ofert + edukacyjna treść

6. **Internal linking strategy**
   - Recenzje linkują do providerów i metod płatności (auto, na podstawie tagów/listy w `casinos.yaml`)
   - Rankingi linkują do recenzji (już zrobione)
   - Blog → kontekstowo (manualnie w MDX)
   - Provider → kasyna z tym providerem
   - Slot → kasyna z tym slotem

7. **Sitemap rozbudowa**
   - Wszystkie nowe typy stron w sitemapie
   - Sitemap-index jeśli > 5000 URL

**Deliverable:** Pełen ekosystem content hubów. Internal linking gęsty. Skalowalność: dodanie providera/slotu = wpis w YAML.

---

### Sprint 4 — UGC i Newsletter

**Cel:** Komentarze i oceny userów, newsletter.

**Zadania:**

1. **UGC infrastruktura**
   - Storage komentarzy (TBD: Cloudflare D1 / KV / własny endpoint)
   - Form komentarza pod recenzjami (nick, email, ocena 1-5, treść)
   - Anti-spam: Cloudflare Turnstile
   - Moderacja: queue → publikacja po akceptacji (panel adminowy minimalny lub edycja JSON)

2. **Display UGC**
   - Komponent `UserReviews` w module 12 recenzji
   - Sortowanie: najnowsze / najwyżej oceniane
   - Paginacja

3. **AggregateRating**
   - Schema.org `AggregateRating` agregujący nasze score + UGC ratings
   - Update przy każdym nowym komentarzu (rebuild lub on-demand)

4. **Newsletter**
   - Wybór dostawcy (Mailchimp / Brevo / inny — TBD)
   - Form widget na blogu, recenzjach, dedykowana strona
   - Lead magnet (np. PDF z bonusami) — treść TBD
   - Double opt-in flow
   - Strona `unsubscribe`

5. **Email templates**
   - Welcome email
   - Confirmation (double opt-in)
   - Newsletter template (do późniejszego wykorzystania)

**Deliverable:** UGC live na recenzjach (z moderacją). Newsletter signup działa, double opt-in, integracja z dostawcą.

---

### Sprint 5 — Migracja i API integration

**Cel:** Migracja na docelowy hosting offshore + spięcie softu Product Ownera po API.

**Zadania:**

1. **Migracja hostingu**
   - Setup środowiska na docelowym hostingu (offshore)
   - Konfiguracja DNS, SSL, CDN
   - Replikacja Cloudflare features (geo-detection — alternative na docelowym hostingu)
   - Zero-downtime migration

2. **API integration — content sync**
   - Dokumentacja schema (endpoints, response format)
   - Skrypt build-time zaciągający treści przez API
   - Cache strategy (revalidation per typ contentu)
   - Fallback: jeśli API down → użyj ostatniego buildu

3. **Webhook trigger build**
   - API softu po publikacji nowej recenzji → webhook → trigger build na hostingu
   - Lub: cron job co X minut sprawdzający zmiany

4. **Monitoring**
   - Uptime monitor (UptimeRobot / lepszy)
   - Error tracking (Sentry — opcjonalnie)
   - Performance monitoring (Cloudflare Analytics + GA4)

5. **Backup strategy**
   - Backup repo (git remote multiple)
   - Backup UGC (komentarze) — periodic export
   - Backup statycznych assets (logos, images)

**Deliverable:** Serwis działa na docelowym hostingu, spięty z softem Product Ownera. Pełny CI/CD od edycji w sofcie do publikacji na prodzie.

---

### Sprint 6+ — Skalowanie i optymalizacja (rolling)

**Cel:** Continuous improvement po starcie.

**Przykładowe zadania:**

- Dodawanie tier 3 longtailów (treść)
- Tłumaczenia polityk per locale
- Tłumaczenia istniejących recenzji na nowe locale
- A/B testy CTA (jeśli okaże się sensowne)
- Optymalizacja Core Web Vitals (jeśli pomiary pokażą braki)
- Rozbudowa person redakcyjnych
- Cloaking linków (jeśli zdecydujemy)
- Bing Webmaster Tools setup
- Zaawansowana analityka (heatmaps, session replay — opcjonalnie)

---

## 14. Otwarte tematy do domknięcia w trakcie

Tematy świadomie zostawione "na potem" — nie blokują startu, ale wymagają decyzji w odpowiednim momencie.

| # | Temat | Kiedy domknąć | Notatka |
|---|---|---|---|
| 1 | Lista zablokowanych krajów (geo-block) | Sprint 0 | Product Owner dostarcza listę |
| 2 | Avatar i finalne bio Alex Morgan | Sprint 1 | Generujemy AI w stylu anime |
| 3 | Treści startowe: 1 recenzja EN + 1 DE | Sprint 1 | Product Owner dostarcza |
| 4 | Tier 1 rankingi: kompletne dane (10-15 kasyn × 11 locale) | Sprint 2 | Product Owner dostarcza |
| 5 | Tier 2 longtaile na EN i DE — wybór 5 slugów + treści | Sprint 2 | Product Owner zatwierdza listę |
| 6 | Home = ranking główny czy osobna strona? | Sprint 2 | Decyzja architekturalna |
| 7 | Methodology page — treść | Sprint 2 | Product Owner / wspólnie |
| 8 | Treści privacy / ToS / RG (wersja EN finalna) | Sprint 1-2 | Prawnik / template + edycja |
| 9 | Wybór dostawcy newslettera | Sprint 4 | Mailchimp / Brevo / inny |
| 10 | Lead magnet — co to jest i jak wyprodukować | Sprint 4 | Product Owner |
| 11 | Schema docelowego API (soft Product Ownera) | Sprint 5 | Product Owner dostarcza spec |
| 12 | Cloaking linków afiliacyjnych — tak/nie | Po starcie | Decyzja po zebraniu danych |
| 13 | Tłumaczenia UI strings (poza EN i DE) | Sprint 0-2 | Iteracyjnie, można AI + review |
| 14 | Storage UGC (D1 / KV / własny) | Sprint 4 | Decyzja przy implementacji |
| 15 | Anti-spam wybór (Turnstile vs hCaptcha) | Sprint 4 | Wstępnie Turnstile |

---

## Załączniki (do uzupełnienia)

- A. Lista zablokowanych krajów
- B. Lista linków afiliacyjnych (template)
- C. Treść disclosure per locale
- D. Treść Privacy Policy (EN)
- E. Treść ToS (EN)
- F. Lista tier 1 rankingów per locale (kompletne dane)
- G. Lista tier 2 longtailów na EN i DE
- H. Spec API softu Product Ownera

---

**Koniec dokumentu v1.0**

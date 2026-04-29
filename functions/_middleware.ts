/**
 * Cloudflare Pages middleware — geo-block.
 *
 * Runs at the edge BEFORE Astro static assets are served. Reads the
 * `CF-IPCountry` header that Cloudflare attaches to every request and, if the
 * request originates from a blocked country, serves the static
 * "region not available" page with a 451 status.
 *
 * When migrating to offshore hosting (post-MVP), replace this with the host's
 * equivalent: Nginx `geoip2` module + `if`, Apache `mod_geoip`, or a tiny
 * Node/Express middleware. The Astro build itself is host-agnostic.
 *
 * Source of truth: data/blocked-countries.yaml. The pre-build step
 * scripts/build-blocked-countries.mjs (wired into npm `prebuild`) generates
 * the JSON imported here. Edit the YAML, never this file.
 */

import blockedData from './_blocked-countries.json' assert { type: 'json' };
const BLOCKED_COUNTRIES: readonly string[] = blockedData.codes;

const REGION_NOT_AVAILABLE_PATH = '/en/region-not-available/';

const STATIC_PASS_THROUGH = [
  '/_astro/',
  '/fonts/',
  '/brand/',
  '/og-default.png',
  '/favicon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/robots.txt',
  '/sitemap-index.xml',
  '/sitemap-0.xml',
];

const STATIC_EXT = /\.(svg|png|jpg|jpeg|webp|avif|ico|css|js|mjs|woff2?|ttf|otf|xml|txt|map)$/i;

interface Env {
  ASSETS: { fetch: (req: Request | string) => Promise<Response> };
}

interface Context {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

export const onRequest = async (context: Context): Promise<Response> => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Always allow the "blocked" page itself (avoid redirect loops)
  if (path.startsWith(REGION_NOT_AVAILABLE_PATH)) {
    return next();
  }
  // Static asset pass-through
  if (STATIC_PASS_THROUGH.some((p) => path.startsWith(p))) return next();
  if (STATIC_EXT.test(path)) return next();

  const country = (request.headers.get('cf-ipcountry') ?? '').toUpperCase();

  if (country && BLOCKED_COUNTRIES.includes(country)) {
    // Fetch the static "region not available" asset and serve it with 451.
    const blockedUrl = new URL(REGION_NOT_AVAILABLE_PATH, url);
    blockedUrl.searchParams.set('cc', country);
    const assetResp = await env.ASSETS.fetch(blockedUrl.toString());
    return new Response(assetResp.body, {
      status: 451, // Unavailable For Legal Reasons (RFC 7725)
      headers: {
        ...Object.fromEntries(assetResp.headers),
        'X-Geo-Block': 'true',
        'X-Geo-Block-Country': country,
        'Cache-Control': 'no-store',
      },
    });
  }

  return next();
};

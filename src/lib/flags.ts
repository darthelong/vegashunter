/**
 * Feature flags — Sprint 0 keeps cookie consent designed but disabled until
 * the site goes live and any tracking pixels are introduced.
 *
 * Flip to enable; rebuild the site.
 */
export const FLAGS = {
  /** Cookie consent banner. Enable once GA4 or any cookie-using script is added. */
  COOKIE_CONSENT_ENABLED: false,

  /** Fixed full age gate (interstitial 18+ confirmation). Off — soft 18+ banner used instead. */
  FULL_AGE_GATE: false,

  /** Show "DRAFT" watermark in dev. */
  DEV_WATERMARK: import.meta.env.DEV,

  /** Show language switcher in header. */
  LANGUAGE_SWITCHER_IN_HEADER: true,

  /** UGC (Sprint 4). */
  UGC_ENABLED: false,
} as const;

export type FlagKey = keyof typeof FLAGS;

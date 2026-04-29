/**
 * VegasHunter — Press Ledger v0.2
 * Tokens mirror brand/design-tokens.json. When the JSON changes, mirror here.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:      '#0B0A10',
        dusk:     '#14111C',
        twilight: '#1F1A2A',
        hairline: '#2D2640',
        mute:     '#5F567A',
        silver:   '#B3AAC3',
        bone:     '#F4EFE2',
        ribbon:   '#FF2D7A',
        gold:     '#C5A572',
        ivy:      '#2F6B4F',
        amber:    '#D89A4A',
        crimson:  '#B33A3A',
      },
      fontFamily: {
        display: ['Gloock', 'Georgia', 'serif'],
        body:    ['"Bricolage Grotesque"', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        editorial: ['"Crimson Pro"', 'Georgia', 'serif'],
      },
      fontSize: {
        // Editorial scale (matches design-tokens.json type.scale)
        'wordmark': ['200px', { lineHeight: '200px', letterSpacing: '0' }],
        'headline': ['88px',  { lineHeight: '92px' }],
        '5xl':      ['64px',  { lineHeight: '72px' }],
        '4xl':      ['48px',  { lineHeight: '56px' }],
        '3xl':      ['36px',  { lineHeight: '44px' }],
        '2xl':      ['28px',  { lineHeight: '36px' }],
        'xl':       ['22px',  { lineHeight: '32px' }],
        'lg':       ['18px',  { lineHeight: '28px' }],
        'base':     ['16px',  { lineHeight: '26px' }],
        'sm':       ['14px',  { lineHeight: '20px', letterSpacing: '0.02em' }],
        'xs':       ['12px',  { lineHeight: '16px', letterSpacing: '0.04em' }],
      },
      letterSpacing: {
        'mono-caps': '0.18em',
        'tight':     '-0.005em',
      },
      borderColor: {
        DEFAULT: '#2D2640',
      },
      boxShadow: {
        'cta-hover': '0 0 0 4px rgba(255,45,122,0.18)',
      },
      transitionTimingFunction: {
        'press': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

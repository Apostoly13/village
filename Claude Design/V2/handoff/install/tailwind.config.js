/**
 * The Village — Tailwind preset
 * Source of truth is DESIGN-LANGUAGE.md. Every token below exists because it's in the doc.
 */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        paper:        'var(--paper)',
        card:         'var(--card)',
        ink:          'var(--ink)',
        'ink-muted':  'var(--ink-muted)',
        'ink-faint':  'var(--ink-faint)',
        line:         'var(--line)',
        'line-soft':  'var(--line-soft)',
        accent:       'var(--accent)',
        'accent-soft':'var(--accent-soft)',
        banner:       'var(--banner)',
        button:       'var(--button)',
        'button-ink': 'var(--button-ink)',
        support:      'var(--support)',
        warn:         'var(--warn)',
      },
      fontFamily: {
        display: ['Fraunces', 'Times New Roman', 'serif'],
        ui:      ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'wordmark':   ['32px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'display-lg': ['56px', { lineHeight: '60px', letterSpacing: '-0.02em', fontWeight: '400' }],
        'display-md': ['40px', { lineHeight: '44px', letterSpacing: '-0.015em', fontWeight: '400' }],
        'greeting':   ['44px', { lineHeight: '48px', letterSpacing: '-0.015em', fontWeight: '400' }],
        'section':    ['28px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'card-title': ['17px', { lineHeight: '24px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body':       ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm':    ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'label':      ['13px', { lineHeight: '16px', fontWeight: '500' }],
        'micro':      ['11px', { lineHeight: '14px', fontWeight: '500' }],
        'eyebrow':    ['11px', { lineHeight: '14px', letterSpacing: '0.12em', fontWeight: '500' }],
        'quote':      ['22px', { lineHeight: '30px', fontWeight: '400' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      boxShadow: {
        soft:  'var(--shadow-soft)',
        card:  'var(--shadow-card)',
        float: 'var(--shadow-float)',
      },
      maxWidth: {
        'feed':    '720px',
        'reading': '640px',
        'shell':   '960px',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/**/*.svelte',
    './src/app.html'
  ],
  theme: {
    fontFamily: {
      sans: ['Space Grotesk', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {
      colors: {
        ez: {
          // Brand
          yellow:       '#EEC216',
          'yellow-lt':  '#F5D44A',
          'yellow-dk':  '#C9A30D',
          orange:       '#F29C1C',
          'orange-lt':  '#F7B84E',
          red:          '#DB2547',
          'red-lt':     '#E85A76',
          'red-dk':     '#B01C39',

          // Warm dark neutral ramp (black → white)
          black:        '#0C0B0A',
          s0:           '#111110',
          s1:           '#1A1917',
          s2:           '#252320',
          s3:           '#322F2B',
          border:       '#3A3733',
          'border-lt':  '#4A4744',
          muted:        '#7A7671',
          subtle:       '#B0ACA6',
          text:         '#F0EDE8',
          white:        '#FAF9F7',

          // Semantic
          success:      '#2DBD72',
          info:         '#3B9EF5',
        },
      },
      fontSize: {
        '2xs': '10px',
        xs:    ['11px', '1.5'],
        sm:    ['13px', '1.5'],
        base:  ['15px', '1.6'],
        md:    ['17px', '1.6'],
        lg:    ['20px', '1.5'],
        xl:    ['24px', '1.3'],
        '2xl': ['30px', '1.2'],
        '3xl': ['40px', '1.1'],
        '4xl': ['52px', '1.05'],
        '5xl': ['68px', '1'],
      },
      borderRadius: {
        sm:   '3px',
        md:   '6px',
        lg:   '10px',
        xl:   '16px',
        pill: '999px',
      },
      boxShadow: {
        sm:            '0 1px 3px rgba(0,0,0,0.4)',
        md:            '0 4px 12px rgba(0,0,0,0.5)',
        lg:            '0 8px 32px rgba(0,0,0,0.6)',
        'glow-yellow': '0 0 20px rgba(238,194,22,0.25)',
        'glow-red':    '0 0 20px rgba(219,37,71,0.25)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '350ms',
      },
    },
  },
  plugins: [],
}

import animate from 'tailwindcss-animate';

const hslVar = (name) => `hsl(var(${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: hslVar('--border'),
        input: hslVar('--input'),
        ring: hslVar('--ring'),
        background: hslVar('--background'),
        foreground: hslVar('--foreground'),
        primary: {
          DEFAULT: hslVar('--primary'),
          foreground: hslVar('--primary-foreground'),
        },
        secondary: {
          DEFAULT: hslVar('--secondary'),
          foreground: hslVar('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: hslVar('--destructive'),
          foreground: hslVar('--destructive-foreground'),
        },
        muted: {
          DEFAULT: hslVar('--muted'),
          foreground: hslVar('--muted-foreground'),
        },
        accent: {
          DEFAULT: hslVar('--accent'),
          foreground: hslVar('--accent-foreground'),
        },
        popover: {
          DEFAULT: hslVar('--popover'),
          foreground: hslVar('--popover-foreground'),
        },
        card: {
          DEFAULT: hslVar('--card'),
          foreground: hslVar('--card-foreground'),
        },
        success: {
          DEFAULT: hslVar('--success'),
          foreground: hslVar('--success-foreground'),
          hover: hslVar('--success-hover'),
          accent: hslVar('--success-accent'),
        },
        danger: {
          DEFAULT: hslVar('--danger'),
          foreground: hslVar('--danger-foreground'),
        },
        warning: {
          DEFAULT: hslVar('--warning'),
          foreground: hslVar('--warning-foreground'),
          message: hslVar('--warning-message'),
          muted: hslVar('--warning-muted'),
        },
        info: {
          DEFAULT: hslVar('--info'),
          foreground: hslVar('--info-foreground'),
        },
        tooltip: {
          DEFAULT: hslVar('--tooltip'),
          foreground: hslVar('--tooltip-foreground'),
        },
        empty: {
          foreground: hslVar('--empty-foreground'),
        },
        overlay: hslVar('--overlay'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

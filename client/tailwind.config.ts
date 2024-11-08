import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      animation: {
        'scale-up-center':
          'scale-up-center 0.4s cubic-bezier(0.175, 0.885, 0.320, 1.275)   both',
        'fade-in':
          'fade-in 0.4s cubic-bezier(0.190, 1.000, 0.220, 1.000)   both',
        'swing-in-top-fwd':
          'swing-in-top-fwd 1.2s cubic-bezier(0.175, 0.885, 0.320, 1.275)   both',
        'swing-in-bottom-fwd':
          'swing-in-bottom-fwd 1.2s cubic-bezier(0.175, 0.885, 0.320, 1.275)   both',
      },
      keyframes: {
        'scale-up-center': {
          '0%': {
            transform: 'scale(.5)',
          },
          to: {
            transform: 'scale(1)',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          to: {
            opacity: '1',
          },
        },
        'swing-in-top-fwd': {
          '0%': {
            transform: 'rotateX(-100deg)',
            'transform-origin': 'top',
            opacity: '0',
          },
          to: {
            transform: 'rotateX(0deg)',
            'transform-origin': 'top',
            opacity: '1',
          },
        },
        'swing-in-bottom-fwd': {
          '0%': {
            transform: 'rotateX(100deg)',
            'transform-origin': 'bottom',
            opacity: '0',
          },
          to: {
            transform: 'rotateX(0)',
            'transform-origin': 'bottom',
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;

/**
 * Tailwind CSS Configuration File
 *
 * Modified by Dulapah Vibulsanti (https://dulapahv.dev) from auto-generated
 * code by Tailwind CSS CLI and shadcn/ui CLI.
 */

import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
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
          'scale-up-center 0.4s cubic-bezier(0.175, 0.885, 0.320, 1.275) both',
        'fade-in': 'fade-in 0.4s cubic-bezier(0.190, 1.000, 0.220, 1.000) both',
        'fade-out':
          'fade-out 0.4s cubic-bezier(0.190, 1.000, 0.220, 1.000) both',
        'fade-in-top': 'fade-in-top 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in-bottom':
          'fade-in-bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in-left': 'fade-in-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in-right': 'fade-in-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
        spinner: 'spinner 1s linear infinite',
      },
      keyframes: {
        'scale-up-center': {
          '0%': { transform: 'scale(.5)' },
          to: { transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'fade-in-top': {
          '0%': {
            transform: 'translateY(-25px)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fade-in-bottom': {
          '0%': {
            transform: 'translateY(25px)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fade-in-left': {
          '0%': {
            transform: 'translateX(-25px)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'fade-in-right': {
          '0%': {
            transform: 'translateX(25px)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        spinner: {
          '0%': { opacity: '1' },
          '10%': { opacity: '0.7' },
          '20%': { opacity: '0.3' },
          '35%': { opacity: '0.2' },
          '50%': { opacity: '0.1' },
          '75%': { opacity: '0.05' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [animate, typography],
};
export default config;

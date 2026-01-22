/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Theme: Black + Light Blue
        'tor-black': '#0a0a0a',
        'tor-darker': '#050505',
        'tor-green': '#00b4ff',       // Light blue (primary accent)
        'tor-green-dim': '#0099dd',   // Dimmed blue
        'tor-green-dark': '#004d80',  // Dark blue
        'tor-purple': '#8b5cf6',
        'tor-orange': '#ff6600',
        'tor-gray': '#888888',
        'tor-gray-dark': '#333333',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-green': 'pulse-blue 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-blue': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 180, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 180, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};


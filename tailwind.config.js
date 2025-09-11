/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: { space: '#080E1A' },
      boxShadow: {
        glow: '0 0 40px rgba(255,200,140,0.22)',
      },
    },
  },
  plugins: [],
}


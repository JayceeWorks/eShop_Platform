/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind's web runtime sets the color scheme manually, which throws under the default 'media'.
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Simple Concepts theme: navy for headers and text, blue for main buttons, orange for highlights.
      colors: {
        brand: { DEFAULT: '#0A1F4F', tint: '#E7EEFC' },
        primary: '#1557E6',
        accent: '#F7A21B',
        surface: '#F3F6FB',
      },
    },
  },
  plugins: [],
};

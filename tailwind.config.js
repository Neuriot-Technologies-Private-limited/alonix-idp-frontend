/** @type {import('tailwindcss').Config} */
export default {
  // We toggle `class="dark"` / `class="light"` on the <html> element (see ThemeProvider).
  // Using class-based dark mode makes all `dark:` utilities react instantly.
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};


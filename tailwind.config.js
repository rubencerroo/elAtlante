/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#1A365D",
        "secondary": "#2D3748",
        "background-light": "#FBFBF9",
        "background-dark": "#1A1C1E",
        "coastal": {
          "slate": "#4A5568",
          "sea": "#2B6E62",
          "sand": "#F0EAD6",
        }
      },
      fontFamily: {
        "sans": ["Inter", "Work Sans", "sans-serif"],
        "serif": ["Lora", "Playfair Display", "serif"],
        "display": ["Lora", "serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      spacing: {
        '25': '6.25rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}

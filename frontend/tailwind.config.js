/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../games/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arcade: {
          bg: 'var(--color-bg)',
          card: 'var(--color-card)',
          'card-inner': 'var(--color-card-inner)',
          border: 'var(--color-border)',
          tile: 'var(--color-tile)',
          'tile-hover': 'var(--color-tile-hover)',
          text: 'var(--color-text)',
          'text-muted': 'var(--color-text-muted)',
          amber: {
            DEFAULT: '#f8a427',
            shadow: '#c97808',
            hover: '#ffb33e',
          },
          blue: {
            DEFAULT: '#276cb8',
            shadow: '#174780',
            hover: '#3b82d4',
          },
          cyan: {
            DEFAULT: '#36b6ff',
            shadow: '#1988cc',
            hover: '#5ec5ff',
          },
          teal: {
            DEFAULT: '#1eb29a',
            shadow: '#127e6c',
            hover: '#29caa0',
          },
          coral: {
            DEFAULT: '#e74c60',
            shadow: '#af2c3e',
            hover: '#f06274',
          },
          slate: {
            DEFAULT: '#5d688e',
            shadow: '#3c4566',
            hover: '#707da8',
          },
          gold: {
            DEFAULT: '#ffbf2b',
            shadow: '#cb9208',
          },
        },
      },
      boxShadow: {
        'arcade-sm': '0 3px 0 var(--tw-shadow-color, #121526)',
        'arcade-md': '0 4px 0 var(--tw-shadow-color, #121526)',
        'arcade-lg': '0 6px 0 var(--tw-shadow-color, #121526)',
        'arcade-tile': '0 5px 0 var(--color-tile-shadow, #14182b)',
        'arcade-tile-pressed': '0 2px 0 var(--color-tile-shadow, #14182b)',
      },
      fontFamily: {
        arcade: [
          'Rubik',
          'Fredoka',
          'Nunito',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

const { createGlobPatternsForDependencies } = require('@nrwl/angular/tailwind');
const { join } = require('path');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'ap-',
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans,sans-serif', ...defaultTheme.fontFamily.sans],
      },
      boxShadow:{
        'step-container-ds':'0px 0px 22px rgba(186, 186, 191, 0.3)'
      },
      backgroundImage: {
        authBg: "url('/assets/img/custom/auth/auth-bg.png')",
        nofbg: "url('/assets/img/custom/auth/404.svg')",
      },
      colors: {
        body: '#4f4f4f',
        border: '#c2c9d1',
        white: '#ffffff',
        grayCard: '#fafafa',
        placeholder: '#c8c8c8',
        danger: {
          DEFAULT: '#dc3545',
          light: '#efa2a980',
        },
        primary: { DEFAULT: '#6e41e2', light: '#EEE8FC' },
        warn: '#f78a3b',
        blueLink: '#1890ff',
        sidebar: '#FAFBFC',
        blueBorder: '#6385dc',
        purpleBorder: '#af6cd9',
        greenBorder: '#5Fd2b0',
        description: '#8C8C8C',
        hover: '#fafafa',
        success: '#209e34',
        dividers: '#e0e4e8',
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
      },
    },
  },
  plugins: [],
};

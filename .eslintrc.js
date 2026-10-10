module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended', // For future TypeScript support
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Code style
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],

    // Best practices
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'warn',
    'no-undef': 'error',

    // React specific (for frontend)
    'react/prop-types': 'off', // Will enable when using TypeScript

    // Allow async/await
    'no-async-promise-executor': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.config.js',
    '*.config.ts',
  ],
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['frontend/src/**/*.{js,jsx}'],
      env: {
        browser: true,
        es6: true,
      },
      extends: ['eslint:recommended'],
      rules: {
        'no-unused-vars': 'warn',
        'react/react-in-jsx-scope': 'off', // React 17+ JSX Transform
      },
    },
    {
      files: ['backend/src/**/*.js'],
      env: {
        node: true,
        es6: true,
      },
      rules: {
        'no-console': 'off', // Allow console in backend
      },
    },
  ],
};
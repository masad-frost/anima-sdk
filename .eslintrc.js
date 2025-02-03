module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  globals: {
    figma: 'readonly',
    __html__: 'readonly',
  },
  extends: ['plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'unused-imports'],
  rules: {
    'no-undef': 'error',
    'no-debugger': 'error',
    'no-unused-vars': 'off',

    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_.*' }],
    '@typescript-eslint/no-non-null-assertion': 'off',

    'unused-imports/no-unused-imports': 'error',
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
};

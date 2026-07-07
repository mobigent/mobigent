import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.tsbuildinfo',
      'apps/docs/build/**',
      'packages/ios/.build/**',
      'packages/android/.gradle/**',
      'packages/android/build/**',
      'examples/ios-expense/.build/**',
      'examples/android-expense/.gradle/**',
      'examples/android-expense/build/**',
      'coverage/**',
      '.vite/**',
      '**/generated/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
  {
    files: ['examples/**/*.ts', 'examples/**/*.tsx', 'scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-const': 'off',
    },
  },
);

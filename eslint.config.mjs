import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', '.auth'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Page objects expose intention-revealing assertion helpers (expectToBeOpen, expectCartCount, ...)
      // and `loginAs` asserts the landing page, so treat those calls as assertions.
      'playwright/expect-expect': [
        'error',
        { assertFunctionNames: ['loginAs'], assertFunctionPatterns: ['^expect[A-Z]\\w*$'] },
      ],
    },
  },
);

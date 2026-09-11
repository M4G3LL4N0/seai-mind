import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from 'eslint-plugin-next';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      next: nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    ignores: ['.next/', 'node_modules/', 'dist/', '*.config.*'],
  }
);
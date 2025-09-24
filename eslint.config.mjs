import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const tsEslintRecommendedRules =
  tsPlugin.configs['eslint-recommended']?.overrides?.[0]?.rules ?? {};

const tsRecommendedRules = tsPlugin.configs.recommended?.rules ?? {};

export default [
  {
    ignores: ['node_modules', 'dist', '.turbo', '.turbo-prune'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsEslintRecommendedRules,
      ...tsRecommendedRules,
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
    },
  },
  eslintConfigPrettier,
];

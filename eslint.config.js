import js from '@eslint/js'
import css from '@eslint/css'
import json from '@eslint/json'
import markdown from '@eslint/markdown'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import { tailwind4 } from 'tailwind-csstree'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'package-lock.json'] },
  {
    files: ['**/*.{js,ts,vue}'],
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.{ts,vue}'] })),
  ...pluginVue.configs['flat/recommended'].map((config) => ({ ...config, files: ['**/*.vue'] })),
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/*.css'],
    language: 'css/css',
    languageOptions: { customSyntax: tailwind4 },
    ...css.configs.recommended,
    rules: { ...css.configs.recommended.rules, 'css/use-baseline': 'off', 'css/no-invalid-properties': ['error', { allowUnknownVariables: true }] },
  },
  { files: ['**/*.json'], ignores: ['tsconfig*.json'], language: 'json/json', ...json.configs.recommended },
  { files: ['tsconfig*.json'], language: 'json/jsonc', ...json.configs.recommended },
  { files: ['**/*.md'], plugins: { markdown }, language: 'markdown/gfm', rules: markdown.configs.recommended[0].rules },
]

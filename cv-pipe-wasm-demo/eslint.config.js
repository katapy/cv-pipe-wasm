import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended, // より厳格にしたい場合は .strict を追加
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // React Hooksの推奨ルール
      ...reactHooks.configs.recommended.rules,
      // Reactの推奨ルール
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules, // import React from 'react' を不要にする

      // Vite HMRのためのルール
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // importの自動ソート
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // 任意のカスタムルール（例）
      '@typescript-eslint/no-explicit-any': 'warn', // anyの使用を警告
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' } // _から始まる変数は未使用でも許容
      ],
    },
    settings: {
      react: {
        version: '18.3.1', 
      },
    },
  },
  eslintConfigPrettier // Prettierと競合するESLintのルールを無効化（必ず配列の最後に記述）
);
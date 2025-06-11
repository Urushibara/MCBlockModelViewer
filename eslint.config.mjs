import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    ignores: ['dist/**', 'src-tauri/**', 'node_modules/**', 'vite.config.ts'], // 無視するファイル・ディレクトリ
  },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser, // ← これが必要！！
      parserOptions: {
        project: './tsconfig.app.json',
      },
    },
    rules: {
      '@typescript-eslint/only-throw-error': 'error',
    },
  },
]);
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  base: '/cv-pipe-wasm/',
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  server: {
    fs: {
      // プロジェクト外のパスを許可リストに追加
      allow: [
        '.',
      ]
    }
  },
  build: {
    target: 'es2022'
  }
});
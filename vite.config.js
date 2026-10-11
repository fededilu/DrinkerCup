import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { renderSeoHead } from './src/seo/site.js';

export default defineConfig({
  base: '/',
  plugins: [react(), {
    name: 'seo-head',
    transformIndexHtml(html) {
      return html.replace('<!-- SEO_HEAD -->', `<!-- SEO_START -->${renderSeoHead('/')}<!-- SEO_END -->`);
    },
  }],
});

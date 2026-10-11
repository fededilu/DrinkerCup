import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { SITE_URL, publicPages, renderSeoHead } from '../src/seo/site.js';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  ssr: { resolve: { externalConditions: ['module-sync', 'node'] } },
});

try {
  const { default: LandingPage } = await server.ssrLoadModule('/src/pages/LandingPage.jsx');
  const { default: HowItWorksPage } = await server.ssrLoadModule('/src/pages/HowItWorksPage.jsx');
  const { default: Footer } = await server.ssrLoadModule('/src/components/Footer.jsx');
  const { default: NotFoundPage } = await server.ssrLoadModule('/src/pages/NotFoundPage.jsx');
  const template = await readFile('dist/index.html', 'utf8');
  const pages = { '/': LandingPage, '/spiegazione': HowItWorksPage, '/404': NotFoundPage };

  for (const [pathname, Component] of Object.entries(pages)) {
    const body = renderToStaticMarkup(createElement(StaticRouter, { location: pathname },
      createElement('div', { className: 'app' },
        createElement('header', { className: 'navbar' },
          createElement('a', { className: 'brand', href: '/' }, 'Drinker Cup'),
          createElement('nav', { className: 'navLinks', 'aria-label': 'Navigazione principale' },
            createElement('a', { href: '/login' }, 'Login'),
            createElement('a', { href: '/register' }, 'Registrati'),
          ),
        ),
        createElement('main', { className: 'page' }, createElement(Component)),
        createElement(Footer),
      ),
    ));
    const html = template
      .replace(/<!-- SEO_START -->[\s\S]*?<!-- SEO_END -->/, () => renderSeoHead(pathname))
      .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
    const directory = pathname === '/' || pathname === '/404' ? 'dist' : `dist${pathname}`;
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}/${pathname === '/404' ? '404.html' : 'index.html'}`, html);
  }

  // Vite does not copy this project's existing top-level images directory.
  await cp('images', 'dist/images', { recursive: true });
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(publicPages).map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}
</urlset>
`);
  console.log('SEO: pagine pubbliche prerenderizzate, immagini, robots.txt e sitemap.xml generati.');
} finally {
  await server.close();
}

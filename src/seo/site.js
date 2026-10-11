export const SITE_URL = 'https://drinker-cup-v2.web.app';

export const publicPages = {
  '/': {
    title: 'Drinker Cup | Campionati e classifiche tra amici',
    description:
      'Drinker Cup: crea un campionato tra amici, partecipa con un codice invito e consulta punteggi, classifiche e storico delle bevande in un unico posto.',
  },
  '/spiegazione': {
    title: 'Come funziona Drinker Cup | Bevande, punteggi e classifiche',
    description:
      'Scopri come funziona Drinker Cup: registra le bevande, consulta la classifica e controlla il tuo profilo e lo storico delle operazioni.',
  },
};

const privateTitles = {
  '/login': 'Accedi',
  '/register': 'Registrati',
  '/create': 'Crea un campionato',
  '/profile': 'Il tuo profilo',
  '/ranking': 'Classifica',
};

export function getPageSeo(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const page = publicPages[path];
  return {
    title: page?.title || `${privateTitles[path] || (path.startsWith('/championship/') ? 'Campionato' : 'Pagina non trovata')} | Drinker Cup`,
    description: page?.description || publicPages['/'].description,
    canonical: `${SITE_URL}${path}`,
    robots: page ? 'index, follow, max-image-preview:large' : 'noindex, follow',
  };
}

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function renderSeoHead(pathname) {
  const seo = getPageSeo(pathname);
  return `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="robots" content="${seo.robots}" />
    <link rel="canonical" href="${seo.canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Drinker Cup" />
    <meta property="og:locale" content="it_IT" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:url" content="${seo.canonical}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <script type="application/ld+json" id="site-structured-data">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Drinker Cup',
      url: `${SITE_URL}/`,
      inLanguage: 'it-IT',
      description: publicPages['/'].description,
    })}</script>
  `;
}

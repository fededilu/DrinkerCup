import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageSeo } from '../seo/site.js';

export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getPageSeo(pathname);
    document.title = seo.title;
    const values = {
      'meta[name="description"]': seo.description,
      'meta[name="robots"]': seo.robots,
      'meta[property="og:title"]': seo.title,
      'meta[property="og:description"]': seo.description,
      'meta[property="og:url"]': seo.canonical,
      'meta[name="twitter:title"]': seo.title,
      'meta[name="twitter:description"]': seo.description,
    };
    for (const [selector, content] of Object.entries(values)) {
      document.head.querySelector(selector)?.setAttribute('content', content);
    }
    document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', seo.canonical);
  }, [pathname]);

  return null;
}

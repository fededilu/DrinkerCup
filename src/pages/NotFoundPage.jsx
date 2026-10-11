import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="infoPage">
      <h1>Pagina non trovata</h1>
      <p>Il collegamento richiesto non corrisponde a una pagina di Drinker Cup.</p>
      <Link to="/">Torna alla homepage</Link>
    </section>
  );
}

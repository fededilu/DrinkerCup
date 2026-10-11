import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <article className="infoPage">
      <h1>Drinker Cup: campionati e classifiche tra amici</h1>
      <p>
        Drinker Cup ti permette di organizzare campionati tra amici, registrare
        le bevande e consultare punteggi e classifiche in un unico posto.
      </p>
      <section className="infoSection">
        <h2>Crea un campionato o partecipa con un invito</h2>
        <p>
          Crea il tuo campionato e condividi il codice invito con gli amici,
          oppure inserisci il codice di un campionato esistente per partecipare.
        </p>
      </section>
      <section className="infoSection">
        <h2>Tieni traccia delle bevande e dei punteggi</h2>
        <p>
          Registra birre e cocktail, consulta la classifica del campionato e
          ritrova le operazioni nel tuo profilo personale.
        </p>
      </section>
      <div className="landingActions">
        <Link className="primaryAction" to="/register">Registrati</Link>
        <Link to="/login">Accedi</Link>
        <Link to="/spiegazione">Scopri come funziona</Link>
      </div>
    </article>
  );
}

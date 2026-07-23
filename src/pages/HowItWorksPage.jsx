export default function HowItWorksPage() {
  return (
    <article className="infoPage">
      <h1>Come funziona</h1>

      <section className="infoSection" aria-labelledby="how-it-works-title">
        <h2 id="how-it-works-title">Come funziona</h2>
        <p>
          Il sito ti permette di registrare le bevande consumate durante l’estate
          e di partecipare a una classifica insieme agli altri utenti.
        </p>
        <p>
          Ogni volta che consumi una bevanda valida, accedi alla homepage e
          inseriscila nell’apposita sezione. Puoi registrare:
        </p>
        <ul>
          <li>una birra da 0,5 litri;</li>
          <li>una birra da 0,6 litri;</li>
          <li>un cocktail.</li>
        </ul>
        <p>
          Presta attenzione durante l'inserimento e verifica sempre che la
          bevanda selezionata e le informazioni indicate siano corrette. Una
          volta registrata, ogni bevanda contribuirà ad aumentare il tuo
          punteggio personale.
        </p>
        <p>
          In caso di errore, non effettuare ulteriori inserimenti per correggerlo
          autonomamente: contatta l’amministratore del sito, che provvederà a
          verificare e sistemare l’operazione.
        </p>
      </section>

      <section className="infoSection" aria-labelledby="ranking-title">
        <h2 id="ranking-title">La classifica</h2>
        <p>
          Nella pagina Ranking puoi consultare la classifica generale,
          visualizzare il tuo punteggio e confrontarlo con quello degli altri
          partecipanti.
        </p>
        <p>
          Gli utenti vengono ordinati in base al punteggio accumulato durante
          l’estate. Al termine della competizione, il partecipante con il
          punteggio più alto sarà proclamato vincitore.
        </p>
      </section>

      <section className="infoSection" aria-labelledby="profile-title">
        <h2 id="profile-title">Il tuo profilo</h2>
        <p>All’interno della pagina del tuo profilo puoi visualizzare:</p>
        <ul>
          <li>le tue informazioni personali;</li>
          <li>il punteggio raggiunto;</li>
          <li>lo storico completo delle bevande e delle operazioni registrate.</li>
        </ul>
        <p>
          Lo storico ti permette di controllare in qualsiasi momento tutti gli
          inserimenti effettuati.
        </p>
      </section>

      <section className="infoSection" aria-labelledby="support-title">
        <h2 id="support-title">Assistenza</h2>
        <p>
          Per qualsiasi dubbio, problema o richiesta di correzione, puoi
          contattare l'amministratore della pagina.
        </p>
      </section>
    </article>
  );
}

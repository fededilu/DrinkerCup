# Indicizzazione di Drinker Cup

Il dominio principale è `https://drinker-cup-v2.web.app`, configurato in
`src/seo/site.js`. Se cambi dominio, aggiorna `SITE_URL` e ricrea la build.

`npm run build` genera in `dist`:

- homepage pubblica e `/spiegazione` con contenuto HTML, titoli, descrizioni,
  URL canonici, metadati social e dati strutturati;
- `robots.txt` con il riferimento alla sitemap;
- `sitemap.xml` con le sole pagine pubbliche;
- immagini, icone e manifest;
- pagina di errore `404.html` esclusa dall'indice per gli URL inesistenti.

Gli utenti autenticati continuano a vedere i propri campionati in homepage.
Le pagine di accesso, registrazione e dell'area riservata hanno l'header
`X-Robots-Tag: noindex, follow` su Firebase. I vecchi link `/#/...` vengono
convertiti nei nuovi URL dal browser.

## Pubblicazione e richiesta a Google

1. Assicurati che le variabili `VITE_FIREBASE_*` del tuo ambiente di produzione
   siano impostate (vedi `.env.example`), poi esegui `npm run build` e
   `firebase deploy --only hosting`. In PowerShell, se l'esecuzione degli script
   è disabilitata, usa `npm.cmd` e `firebase.cmd`.
2. Controlla che `/robots.txt`, `/sitemap.xml` e `/spiegazione` restituiscano
   i contenuti corretti sul dominio pubblico.
3. Apri [Google Search Console](https://search.google.com/search-console),
   aggiungi una proprietà **Prefisso URL** per `https://drinker-cup-v2.web.app/`
   e verifica la proprietà con il metodo **Tag HTML**: inserisci il tag fornito
   da Google nel `<head>` di `index.html` e ripubblica la build.
4. Nella sezione **Sitemap**, invia `sitemap.xml`.
5. Con **Controllo URL**, verifica la homepage e `/spiegazione`, quindi usa
   **Richiedi indicizzazione**.

La richiesta e la sitemap aiutano Google a scoprire il sito; tempi,
indicizzazione e posizione nei risultati dipendono da Google e non sono garantiti.

Riferimenti: [SEO per JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[creazione e invio delle sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

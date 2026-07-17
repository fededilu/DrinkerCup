import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/authService.js';
import { getUserProfile, subscribeToUserDrinkSummary } from '../services/beerService.js';

const emptySummary = {
  beer05: 0,
  beer066: 0,
  cocktail: 0,
  totalEntries: 0,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      setError('Sessione scaduta. Effettua di nuovo il login.');
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    getUserProfile(user.uid)
      .then((userProfile) => {
        if (isMounted) {
          setProfile(userProfile);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Impossibile caricare i dati profilo.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const unsubscribe = subscribeToUserDrinkSummary(
      user.uid,
      setSummary,
      () => setError('Impossibile caricare il riepilogo consumazioni.'),
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <div className="status">Caricamento profilo...</div>;
  }

  const user = getCurrentUser();
  const firstName = profile?.firstName || getFirstNameFallback(user?.displayName);
  const lastName = profile?.lastName || getLastNameFallback(user?.displayName);
  const email = profile?.email || user?.email || '-';

  return (
    <section className="profilePage">
      <div className="counterHeader">
        <h1>Profilo</h1>
        <p>Controlla i tuoi dati e il riepilogo delle consumazioni registrate.</p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="profilePanel" aria-labelledby="profile-data-title">
        <h2 id="profile-data-title">Dati utente</h2>
        <dl className="profileDetails">
          <div>
            <dt>Nome</dt>
            <dd>{firstName || '-'}</dd>
          </div>
          <div>
            <dt>Cognome</dt>
            <dd>{lastName || '-'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Data registrazione</dt>
            <dd>{formatDate(profile?.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="profilePanel" aria-labelledby="drink-summary-title">
        <h2 id="drink-summary-title">Riepilogo consumazioni</h2>
        <div className="summaryGrid">
          <SummaryItem label="Birre 0,5L" value={summary.beer05} />
          <SummaryItem label="Birre 0,66L" value={summary.beer066} />
          <SummaryItem label="Cocktail" value={summary.cocktail} />
          <SummaryItem label="Movimenti salvati" value={summary.totalEntries} />
        </div>
      </section>
    </section>
  );
}

function SummaryItem({ label, value }) {
  return (
    <article className="summaryItem">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) {
    return '-';
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp.toDate());
}

function getFirstNameFallback(displayName = '') {
  return displayName.split(' ')[0] || '';
}

function getLastNameFallback(displayName = '') {
  return displayName.split(' ').slice(1).join(' ');
}

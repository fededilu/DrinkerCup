import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService.js';
import {
  getUserDrinkHistory,
  getUserProfile,
  subscribeToUserDrinkSummary,
} from '../services/beerService.js';
import {
  getChampionshipRole,
  isChampionshipAdmin,
  removeChampionshipMembers,
  subscribeToUserChampionships,
} from '../services/championshipService.js';

const emptySummary = {
  beer05: 0,
  beer066: 0,
  cocktail: 0,
  totalEntries: 0,
};

const detailFilters = {
  beer05: {
    label: 'Birre 0,5L',
    type: 'beer',
    volumeLiters: 0.5,
  },
  beer066: {
    label: 'Birre 0,66L',
    type: 'beer',
    volumeLiters: 0.66,
  },
  cocktail: {
    label: 'Cocktail',
    type: 'cocktail',
  },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(emptySummary);
  const [championships, setChampionships] = useState([]);
  const [activeDetail, setActiveDetail] = useState('');
  const [history, setHistory] = useState([]);
  const [deletingChampionshipId, setDeletingChampionshipId] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
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
    const unsubscribeChampionships = subscribeToUserChampionships(
      user.uid,
      setChampionships,
      () => setError('Impossibile caricare i campionati del profilo.'),
    );

    return () => {
      isMounted = false;
      unsubscribe();
      unsubscribeChampionships();
    };
  }, []);

  if (isLoading) {
    return <div className="status">Caricamento profilo...</div>;
  }

  const user = getCurrentUser();
  const firstName = profile?.firstName || getFirstNameFallback(user?.displayName);
  const lastName = profile?.lastName || getLastNameFallback(user?.displayName);
  const email = profile?.email || user?.email || '-';

  async function handleDetailsClick(detailKey) {
    if (activeDetail === detailKey) {
      setActiveDetail('');
      setHistory([]);
      return;
    }

    setError('');
    setActiveDetail(detailKey);
    setHistory([]);

    if (!user) {
      setError('Sessione scaduta. Effettua di nuovo il login.');
      return;
    }

    setIsHistoryLoading(true);

    try {
      const entries = await getUserDrinkHistory(user.uid, detailFilters[detailKey]);
      setHistory(entries);
    } catch (historyError) {
      setError(getHistoryErrorMessage(historyError.code));
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function handleDeleteChampionship(championship) {
    setError('');

    if (!user) {
      setError('Sessione scaduta. Effettua di nuovo il login.');
      return;
    }

    const confirmed = window.confirm(
      `Vuoi eliminare "${championship.name}"? Gli utenti non saranno piu associati a questo campionato.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingChampionshipId(championship.id);

    try {
      await removeChampionshipMembers({ user, championshipId: championship.id });
    } catch (deleteError) {
      setError(getChampionshipDeleteErrorMessage(deleteError.code));
    } finally {
      setDeletingChampionshipId('');
    }
  }

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
          <SummaryItem
            label="Birre 0,5L"
            value={summary.beer05}
            isActive={activeDetail === 'beer05'}
            onDetailsClick={() => handleDetailsClick('beer05')}
          />
          <SummaryItem
            label="Birre 0,66L"
            value={summary.beer066}
            isActive={activeDetail === 'beer066'}
            onDetailsClick={() => handleDetailsClick('beer066')}
          />
          <SummaryItem
            label="Cocktail"
            value={summary.cocktail}
            isActive={activeDetail === 'cocktail'}
            onDetailsClick={() => handleDetailsClick('cocktail')}
          />
          <SummaryItem label="Movimenti salvati" value={summary.totalEntries} />
        </div>

        {activeDetail ? (
          <DrinkHistory
            entries={history}
            isLoading={isHistoryLoading}
            title={detailFilters[activeDetail].label}
          />
        ) : null}
      </section>

      <section className="profilePanel" aria-labelledby="profile-championships-title">
        <h2 id="profile-championships-title">Campionati</h2>
        {championships.length === 0 ? (
          <p>Nessun campionato creato o partecipato.</p>
        ) : (
          <div className="profileChampionshipList">
            {championships.map((championship) => (
              <ProfileChampionshipItem
                championship={championship}
                isDeleting={deletingChampionshipId === championship.id}
                isAdmin={isChampionshipAdmin(championship, user?.uid)}
                key={championship.id}
                onDelete={() => handleDeleteChampionship(championship)}
                role={getChampionshipRole(championship, user?.uid)}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function ProfileChampionshipItem({ championship, isAdmin, isDeleting, onDelete, role }) {
  return (
    <article className="profileChampionshipItem">
      <Link className="profileChampionshipLink" to={`/championship/${championship.id}`}>
        <strong>{championship.name}</strong>
        <span>{role === 'ADMIN' ? 'Creato da te' : 'Partecipante'}</span>
        <span>Codice {championship.code}</span>
      </Link>
      {isAdmin ? (
        <button
          aria-label={`Elimina ${championship.name}`}
          className="dangerIconButton"
          disabled={isDeleting}
          onClick={onDelete}
          title="Elimina campionato"
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M6 6l1 15h10l1-15" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      ) : null}
    </article>
  );
}

function SummaryItem({ label, value, isActive = false, onDetailsClick }) {
  return (
    <article className="summaryItem">
      <span>{label}</span>
      <strong>{value}</strong>
      {onDetailsClick ? (
        <button type="button" onClick={onDetailsClick}>
          {isActive ? 'Chiudi' : 'Dettagli'}
        </button>
      ) : null}
    </article>
  );
}

function DrinkHistory({ entries, isLoading, title }) {
  if (isLoading) {
    return <p className="status">Caricamento dettagli...</p>;
  }

  return (
    <div className="historyPanel">
      <h3>Cronologia {title}</h3>
      {entries.length === 0 ? (
        <p>Nessun movimento registrato.</p>
      ) : (
        <div className="historyList">
          {entries.map((entry) => (
            <article className="historyItem" key={entry.id}>
              <strong>{formatSignedQuantity(entry.quantity)}</strong>
              <span>{formatDrinkType(entry)}</span>
              <time>{formatDate(entry.createdAt || entry.timestamp)}</time>
            </article>
          ))}
        </div>
      )}
    </div>
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

function formatSignedQuantity(quantity) {
  return quantity > 0 ? `+${quantity}` : `${quantity}`;
}

function formatDrinkType(entry) {
  if (entry.type === 'beer') {
    return `Birra ${String(entry.volumeLiters).replace('.', ',')}L`;
  }

  return 'Cocktail';
}

function getHistoryErrorMessage(code) {
  switch (code) {
    case 'failed-precondition':
      return 'La query richiede un indice Firestore. Apri il link nella console del browser per crearlo.';
    case 'permission-denied':
      return 'Non hai i permessi per leggere questi movimenti.';
    default:
      return 'Impossibile caricare la cronologia movimenti.';
  }
}

function getChampionshipDeleteErrorMessage(code) {
  switch (code) {
    case 'championship-not-found':
      return 'Campionato non trovato.';
    case 'permission-denied':
      return 'Solo un ADMIN puo eliminare il campionato.';
    default:
      return 'Eliminazione del campionato non riuscita. Riprova.';
  }
}

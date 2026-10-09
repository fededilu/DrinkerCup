import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BeerCounter from '../components/BeerCounter.jsx';
import RankingTable from '../components/RankingTable.jsx';
import { getCurrentUser } from '../services/authService.js';
import { getUserProfile } from '../services/beerService.js';
import {
  joinChampionship,
  subscribeToChampionship,
} from '../services/championshipService.js';

export default function ChampionshipPage() {
  const { championshipId } = useParams();
  const [championship, setChampionship] = useState(null);
  const [activeTab, setActiveTab] = useState('counter');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return subscribeToChampionship(
      championshipId,
      (item) => {
        setChampionship(item);
        setIsLoading(false);
      },
      () => {
        setError('Impossibile caricare il campionato.');
        setIsLoading(false);
      },
    );
  }, [championshipId]);

  if (isLoading) {
    return <div className="status">Caricamento campionato...</div>;
  }

  if (!championship) {
    return <div className="status">Campionato non trovato.</div>;
  }

  const user = getCurrentUser();
  const isMember = Boolean(user && championship.memberIds?.includes(user.uid));

  async function handleJoin() {
    setError('');

    if (!user) {
      setError('Sessione scaduta. Effettua di nuovo il login.');
      return;
    }

    setIsJoining(true);

    try {
      const profile = await getUserProfile(user.uid);
      await joinChampionship({ user, profile, championshipId });
    } catch (joinError) {
      setError(getJoinErrorMessage(joinError.code));
    } finally {
      setIsJoining(false);
    }
  }

  if (!isMember) {
    return (
      <section className="profilePage">
        <div className="counterHeader">
          <h1>{championship.name}</h1>
          <p>Codice invito: {championship.code}</p>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <section className="profilePanel">
          <h2>Unisciti al campionato</h2>
          <p>Per registrare drink e vedere la classifica devi prima entrare.</p>
          <button className="primaryAction" type="button" onClick={handleJoin} disabled={isJoining}>
            {isJoining ? 'Accesso...' : 'Entra nel campionato'}
          </button>
        </section>
      </section>
    );
  }

  return (
    <section className="championshipPage">
      <div className="championshipHeader">
        <div>
          <h1>{championship.name}</h1>
          <p>
            Codice {championship.code} · {formatDate(championship.startsAt)} -{' '}
            {formatDate(championship.endsAt)}
          </p>
        </div>
        <div className="tabActions" role="tablist" aria-label="Sezioni campionato">
          <button
            className={activeTab === 'counter' ? 'active' : ''}
            type="button"
            onClick={() => setActiveTab('counter')}
          >
            Drink
          </button>
          <button
            className={activeTab === 'ranking' ? 'active' : ''}
            type="button"
            onClick={() => setActiveTab('ranking')}
          >
            Ranking
          </button>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {activeTab === 'counter' ? (
        <BeerCounter championship={championship} />
      ) : (
        <RankingTable championship={championship} />
      )}
    </section>
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
  }).format(timestamp.toDate());
}

function getJoinErrorMessage(code) {
  switch (code) {
    case 'championship-not-found':
      return 'Campionato non trovato.';
    case 'permission-denied':
      return 'Non hai i permessi per entrare in questo campionato.';
    default:
      return 'Accesso al campionato non riuscito. Riprova.';
  }
}

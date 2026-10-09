import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService.js';
import { getUserProfile } from '../services/beerService.js';
import {
  joinChampionshipByCode,
  subscribeToUserChampionships,
} from '../services/championshipService.js';

export default function HomePage() {
  const navigate = useNavigate();
  const [championships, setChampionships] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      setError('Sessione scaduta. Effettua di nuovo il login.');
      setIsLoading(false);
      return undefined;
    }

    return subscribeToUserChampionships(
      user.uid,
      (items) => {
        setChampionships(items);
        setIsLoading(false);
      },
      () => {
        setError('Impossibile caricare i campionati.');
        setIsLoading(false);
      },
    );
  }, []);

  async function handleJoin(event) {
    event.preventDefault();
    setError('');

    if (!joinCode.trim()) {
      setError('Inserisci il codice del campionato.');
      return;
    }

    const user = getCurrentUser();

    if (!user) {
      setError('Sessione scaduta. Effettua di nuovo il login.');
      return;
    }

    setIsJoining(true);

    try {
      const profile = await getUserProfile(user.uid);
      const championshipId = await joinChampionshipByCode({ user, profile, code: joinCode });
      navigate(`/championship/${championshipId}`);
    } catch (joinError) {
      setError(getChampionshipErrorMessage(joinError.code));
    } finally {
      setIsJoining(false);
    }
  }

  if (isLoading) {
    return <div className="status">Caricamento campionati...</div>;
  }

  return (
    <section className="homePage">
      <div className="counterHeader">
        <h1>I tuoi campionati</h1>
        <p>Apri un campionato esistente o entra tramite codice invito.</p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="championshipList" aria-labelledby="championship-list-title">
        <h2 id="championship-list-title">Campionati a cui partecipi</h2>
        {championships.length === 0 ? (
          <p>Nessun campionato attivo o passato.</p>
        ) : (
          <div className="rankingList">
            {championships.map((championship) => (
              <Link
                className="championshipItem"
                key={championship.id}
                to={`/championship/${championship.id}`}
              >
                <strong>{championship.name}</strong>
                <span>Codice {championship.code}</span>
                <span>{formatPeriod(championship)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="profilePanel">
        <h2>Partecipa</h2>
        <form className="inlineForm" onSubmit={handleJoin}>
          <label>
            Codice campionato
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
            />
          </label>
          <button type="submit" disabled={isJoining}>
            {isJoining ? 'Accesso...' : 'Entra'}
          </button>
        </form>
      </section>
    </section>
  );
}

function formatPeriod(championship) {
  return `${formatDate(championship.startsAt)} - ${formatDate(championship.endsAt)}`;
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

function getChampionshipErrorMessage(code) {
  switch (code) {
    case 'active-championship-limit':
      return 'Puoi creare al massimo 2 campionati attivi nello stesso momento.';
    case 'championship-not-found':
      return 'Nessun campionato trovato con questo codice.';
    case 'permission-denied':
      return 'Operazione non autorizzata. Controlla le regole Firestore.';
    default:
      return 'Operazione non riuscita. Riprova.';
  }
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService.js';
import { getUserProfile } from '../services/beerService.js';
import {
  availableDrinks,
  createChampionship,
  joinChampionshipByCode,
  subscribeToUserChampionships,
} from '../services/championshipService.js';

const defaultForm = {
  name: '',
  durationDays: 30,
  drinks: availableDrinks.map((drink) => ({
    ...drink,
    enabled: true,
    points: drink.defaultPoints,
  })),
};

export default function HomePage() {
  const navigate = useNavigate();
  const [championships, setChampionships] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [isCreating, setIsCreating] = useState(false);
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

  async function handleCreate(event) {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Inserisci un nome per il campionato.');
      return;
    }

    if (Number(form.durationDays) < 1) {
      setError('La durata deve essere almeno di 1 giorno.');
      return;
    }

    const user = getCurrentUser();

    if (!user) {
      setError('Sessione scaduta. Effettua di nuovo il login.');
      return;
    }

    setIsCreating(true);

    try {
      const profile = await getUserProfile(user.uid);
      const championshipId = await createChampionship({ user, profile, ...form });
      setForm(defaultForm);
      navigate(`/championship/${championshipId}`);
    } catch (createError) {
      setError(getChampionshipErrorMessage(createError.code));
    } finally {
      setIsCreating(false);
    }
  }

  function updateDrink(drinkKey, changes) {
    setForm((currentForm) => ({
      ...currentForm,
      drinks: currentForm.drinks.map((drink) =>
        drink.key === drinkKey ? { ...drink, ...changes } : drink,
      ),
    }));
  }

  if (isLoading) {
    return <div className="status">Caricamento campionati...</div>;
  }

  return (
    <section className="homePage">
      <div className="counterHeader">
        <h1>I tuoi campionati</h1>
        <p>Entra in un campionato esistente o creane uno nuovo.</p>
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

      <div className="championshipGrid">
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

        <section className="profilePanel">
          <h2>Crea campionato</h2>
          <form className="championshipForm" onSubmit={handleCreate}>
            <label>
              Nome
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Estate 2026"
              />
            </label>
            <label>
              Durata in giorni
              <input
                min="1"
                type="number"
                value={form.durationDays}
                onChange={(event) =>
                  setForm({ ...form, durationDays: Number(event.target.value) })
                }
              />
            </label>

            <div className="drinkSettings">
              {form.drinks.map((drink) => (
                <div className="drinkSetting" key={drink.key}>
                  <label className="checkboxLabel">
                    <input
                      checked={drink.enabled}
                      type="checkbox"
                      onChange={(event) =>
                        updateDrink(drink.key, { enabled: event.target.checked })
                      }
                    />
                    {drink.title}
                  </label>
                  <label>
                    Punti
                    <input
                      step="0.01"
                      type="number"
                      value={drink.points}
                      disabled={!drink.enabled}
                      onChange={(event) =>
                        updateDrink(drink.key, { points: Number(event.target.value) })
                      }
                    />
                  </label>
                </div>
              ))}
            </div>

            <button type="submit" disabled={isCreating}>
              {isCreating ? 'Creazione...' : 'Crea'}
            </button>
          </form>
        </section>
      </div>
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
    case 'no-drinks':
      return 'Seleziona almeno un drink valido per il campionato.';
    case 'permission-denied':
      return 'Operazione non autorizzata. Controlla le regole Firestore.';
    default:
      return 'Operazione non riuscita. Riprova.';
  }
}

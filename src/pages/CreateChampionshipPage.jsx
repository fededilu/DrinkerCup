import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService.js';
import { getUserProfile } from '../services/beerService.js';
import {
  availableDrinks,
  createChampionship,
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

export default function CreateChampionshipPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <section className="homePage">
      <div className="counterHeader">
        <h1>Crea campionato</h1>
        <p>Configura durata, drink validi e punteggio prima di invitare i partecipanti.</p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="profilePanel">
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
    </section>
  );
}

function getChampionshipErrorMessage(code) {
  switch (code) {
    case 'active-championship-limit':
      return 'Puoi creare al massimo 2 campionati attivi nello stesso momento.';
    case 'no-drinks':
      return 'Seleziona almeno un drink valido per il campionato.';
    case 'permission-denied':
      return 'Operazione non autorizzata. Controlla le regole Firestore.';
    default:
      return 'Operazione non riuscita. Riprova.';
  }
}

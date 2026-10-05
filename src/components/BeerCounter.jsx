import { useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '../services/authService.js';
import {
  getUserProfile,
  saveChampionshipDrinkEntries,
  saveDrinkEntries,
} from '../services/beerService.js';

const initialCounts = {
  beer05: 0,
  beer066: 0,
  cocktail: 0,
};

const drinkConfig = [
  {
    key: 'beer05',
    title: 'Birre 0,5L',
    description: 'Formato valido: 0,5 litri.',
    type: 'beer',
    volumeLiters: 0.5,
  },
  {
    key: 'beer066',
    title: 'Birre 0,66L',
    description: 'Formato valido: 0,66 litri.',
    type: 'beer',
    volumeLiters: 0.66,
  },
  {
    key: 'cocktail',
    title: 'Cocktail',
    description: 'Conteggio cocktail consumati.',
    type: 'cocktail',
  },
];

export default function BeerCounter({ championship = null }) {
  const drinks = championship?.drinkConfig || drinkConfig;
  const startingCounts = useMemo(() => {
    return drinks.reduce((result, drink) => ({ ...result, [drink.key]: 0 }), {});
  }, [drinks]);
  const [counts, setCounts] = useState(startingCounts);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCounts(startingCounts);
  }, [startingCounts]);

  const hasChanges = useMemo(
    () => Object.values(counts).some((quantity) => quantity !== 0),
    [counts],
  );

  function updateCount(key, delta) {
    setCounts((currentCounts) => ({
      ...currentCounts,
      [key]: currentCounts[key] + delta,
    }));
    setError('');
    setSuccessMessage('');
  }

  async function handleSave() {
    setError('');
    setSuccessMessage('');

    if (!hasChanges) {
      setError('Aggiungi o rimuovi almeno una bevanda prima di salvare.');
      return;
    }

    const summary = drinks
      .filter((drink) => counts[drink.key] !== 0)
      .map((drink) => `${formatSignedQuantity(counts[drink.key])} ${drink.title}`)
      .join('\n');

    const confirmed = window.confirm(`Confermi il salvataggio?\n\n${summary}`);

    if (!confirmed) {
      return;
    }

    const user = getCurrentUser();

    if (!user) {
      setError('Sessione scaduta. Effettua di nuovo il login.');
      return;
    }

    setIsSaving(true);

    try {
      const profile = await getUserProfile(user.uid);
      const entries = drinks.map((drink) => ({
        key: drink.key,
        type: drink.type,
        volumeLiters: drink.volumeLiters,
        points: drink.points,
        quantity: counts[drink.key],
      }));

      if (championship) {
        await saveChampionshipDrinkEntries({ user, profile, championship, entries });
      } else {
        await saveDrinkEntries({ user, profile, entries });
      }

      setCounts(startingCounts);
      setSuccessMessage('Dati salvati correttamente.');
    } catch (saveError) {
      setError(getSaveErrorMessage(saveError.code));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="counterPage">
      <div className="counterHeader">
        <h1>Registra bevande</h1>
        <p>
          {championship
            ? `Campionato: ${championship.name}`
            : 'Le birre valide sono solo nei formati 0,5L e 0,66L.'}
        </p>
      </div>

      <div className="drinkGrid">
        {drinks.map((drink) => (
          <article className="drinkPanel" key={drink.key}>
            <div>
              <h2>{drink.title}</h2>
              <p>{drink.description}</p>
            </div>

            <output className="drinkCount" aria-label={`Quantita ${drink.title}`}>
              {formatSignedQuantity(counts[drink.key])}
            </output>

            <div className="counterActions" aria-label={`Azioni ${drink.title}`}>
              <button type="button" onClick={() => updateCount(drink.key, -2)}>
                -2
              </button>
              <button type="button" onClick={() => updateCount(drink.key, -1)}>
                -1
              </button>
              <button type="button" onClick={() => updateCount(drink.key, 1)}>
                +1
              </button>
              <button type="button" onClick={() => updateCount(drink.key, 2)}>
                +2
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="savePanel">
        <button type="button" onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? 'Salvataggio...' : 'Salva'}
        </button>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => setCounts(startingCounts)}
          disabled={isSaving || !hasChanges}
        >
          Annulla modifiche
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {successMessage ? <p className="success">{successMessage}</p> : null}
    </section>
  );
}

function formatSignedQuantity(quantity) {
  return quantity > 0 ? `+${quantity}` : `${quantity}`;
}

function getSaveErrorMessage(code) {
  switch (code) {
    case 'permission-denied':
      return 'Salvataggio non autorizzato. Controlla le regole Firestore.';
    default:
      return 'Salvataggio non riuscito. Riprova.';
  }
}

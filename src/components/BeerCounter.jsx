import { useMemo, useState } from 'react';
import { getCurrentUser } from '../services/authService.js';
import { getUserProfile, saveDrinkEntries } from '../services/beerService.js';

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

export default function BeerCounter() {
  const [counts, setCounts] = useState(initialCounts);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

    const summary = drinkConfig
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
      const entries = drinkConfig.map((drink) => ({
        type: drink.type,
        volumeLiters: drink.volumeLiters,
        quantity: counts[drink.key],
      }));

      await saveDrinkEntries({ user, profile, entries });
      setCounts(initialCounts);
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
        <p>Le birre valide sono solo nei formati 0,5L e 0,66L.</p>
      </div>

      <div className="drinkGrid">
        {drinkConfig.map((drink) => (
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
          onClick={() => setCounts(initialCounts)}
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

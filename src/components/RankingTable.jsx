import { useEffect, useState } from 'react';
import { subscribeToRanking } from '../services/beerService.js';

export default function RankingTable() {
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToRanking(
      (items) => {
        setRanking(items);
        setIsLoading(false);
      },
      () => {
        setError('Impossibile caricare la classifica.');
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  if (isLoading) {
    return <div className="status">Caricamento classifica...</div>;
  }

  return (
    <section className="rankingPage">
      <div className="counterHeader">
        <h1>Ranking</h1>
        <p>Classifica ordinata per punti totali.</p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {ranking.length === 0 ? (
        <section className="profilePanel">
          <p>Nessun punteggio registrato.</p>
        </section>
      ) : (
        <div className="rankingList">
          {ranking.map((item, index) => (
            <RankingItem item={item} key={item.id} position={index + 1} />
          ))}
        </div>
      )}
    </section>
  );
}

function RankingItem({ item, position }) {
  return (
    <article className={`rankingItem ${getPodiumClass(position)}`}>
      <span className="rankingPosition">{position}</span>
      <div className="rankingIdentity">
        <strong>{item.displayName || `${item.firstName} ${item.lastName}`}</strong>
        <span>{formatDrinkBreakdown(item)}</span>
      </div>
      <strong className="rankingPoints">{formatPoints(item.points)} pt</strong>
    </article>
  );
}

function getPodiumClass(position) {
  if (position === 1) {
    return 'gold';
  }

  if (position === 2) {
    return 'silver';
  }

  if (position === 3) {
    return 'bronze';
  }

  return '';
}

function formatPoints(points = 0) {
  return new Intl.NumberFormat('it-IT', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(points) ? 0 : 2,
  }).format(points);
}

function formatDrinkBreakdown(item) {
  return `${item.beer05Total || 0} x 0,5L · ${item.beer066Total || 0} x 0,66L · ${
    item.cocktailTotal || 0
  } cocktail`;
}

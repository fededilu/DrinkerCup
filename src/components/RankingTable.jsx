import { useEffect, useState } from 'react';
import {
  subscribeToChampionshipRanking,
  subscribeToRanking,
} from '../services/beerService.js';

export default function RankingTable({ championship = null }) {
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const subscribe = championship
      ? subscribeToChampionshipRanking.bind(null, championship.id)
      : subscribeToRanking;
    const unsubscribe = subscribe(
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
  }, [championship]);

  if (isLoading) {
    return <div className="status">Caricamento classifica...</div>;
  }

  return (
    <section className="rankingPage">
      <div className="counterHeader">
        <h1>Ranking</h1>
        <p>
          {championship
            ? `Classifica di ${championship.name}, ordinata per punti.`
            : 'Classifica ordinata per punti totali.'}
        </p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {ranking.length === 0 ? (
        <section className="profilePanel">
          <p>Nessun punteggio registrato.</p>
        </section>
      ) : (
        <div className="rankingList">
          {ranking.map((item, index) => (
            <RankingItem
              championship={championship}
              item={item}
              key={item.id}
              position={index + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RankingItem({ championship, item, position }) {
  return (
    <article className={`rankingItem ${getPodiumClass(position)}`}>
      <span className="rankingPosition">{position}</span>
      <div className="rankingIdentity">
        <strong>{item.displayName || `${item.firstName} ${item.lastName}`}</strong>
        {championship ? (
          formatChampionshipBreakdown(item, championship.drinkConfig).map((line) => (
            <span key={line}>{line}</span>
          ))
        ) : (
          <>
            <span>{format05L(item)}</span>
            <span>{format06L(item)}</span>
            <span>{formatCocktail(item)}</span>
          </>
        )}
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
  return `${item.beer05Total || 0} x 0,5L ${item.beer066Total || 0} x 0,66L · ${
    item.cocktailTotal || 0} cocktail`;
}

function formatChampionshipBreakdown(item, drinkConfig = []) {
  return drinkConfig.map((drink) => {
    const total = item.drinkTotals?.[drink.key] ?? 0;
    return `${total} x ${drink.title}`;
  });
}

function format05L(item){
    return `${getDrinkTotal(item, 'beer05', 'beer05Total')} x 0,5L`
}


function format06L(item){
    return `${getDrinkTotal(item, 'beer066', 'beer066Total')} x 0,66L`
}

function formatCocktail(item){
    return `${getDrinkTotal(item, 'cocktail', 'cocktailTotal')} x cocktail`
}

function getDrinkTotal(item, drinkKey, legacyKey) {
  return item.drinkTotals?.[drinkKey] ?? item[legacyKey] ?? 0;
}

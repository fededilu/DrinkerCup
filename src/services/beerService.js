import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig.js';

const pointWeights = {
  beer05: 1,
  beer066: 1.32,
  cocktail: 1,
};

export async function getUserProfile(userId) {
  const snapshot = await getDoc(doc(db, 'users', userId));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

export async function saveDrinkEntries({ user, profile, entries }) {
  const validEntries = entries.filter((entry) => entry.quantity !== 0);

  if (validEntries.length === 0) {
    return;
  }

  const displayName =
    profile?.displayName || user.displayName || user.email || 'Utente senza nome';
  const [fallbackFirstName = '', fallbackLastName = ''] = displayName.split(' ');
  const statDeltas = calculateStatDeltas(validEntries);
  const entryRefs = validEntries.map(() => doc(collection(db, 'drinkEntries')));
  const statsRef = doc(db, 'userStats', user.uid);

  await runTransaction(db, async (transaction) => {
    const statsSnapshot = await transaction.get(statsRef);
    const currentStats = statsSnapshot.exists() ? statsSnapshot.data() : {};
    const nextStats = buildNextStats({
      currentStats,
      displayName,
      email: user.email,
      firstName: profile?.firstName || fallbackFirstName,
      lastName: profile?.lastName || fallbackLastName,
      userId: user.uid,
      statDeltas,
    });

    validEntries.forEach((entry, index) => {
      const payload = {
        userId: user.uid,
        firstName: profile?.firstName || fallbackFirstName,
        lastName: profile?.lastName || fallbackLastName,
        displayName,
        email: user.email,
        type: entry.type,
        quantity: entry.quantity,
        createdAt: serverTimestamp(),
      };

      if (entry.type === 'beer') {
        payload.volumeLiters = entry.volumeLiters;
      }

      transaction.set(entryRefs[index], payload);
    });

    transaction.set(statsRef, nextStats);
  });
}

export function subscribeToUserDrinkSummary(userId, callback, onError) {
  const userEntriesQuery = query(
    collection(db, 'drinkEntries'),
    where('userId', '==', userId),
  );

  return onSnapshot(
    userEntriesQuery,
    (snapshot) => {
      const summary = {
        beer05: 0,
        beer066: 0,
        cocktail: 0,
        totalEntries: snapshot.size,
      };

      snapshot.forEach((entrySnapshot) => {
        const entry = entrySnapshot.data();

        if (entry.type === 'beer' && entry.volumeLiters === 0.5) {
          summary.beer05 += entry.quantity;
          return;
        }

        if (entry.type === 'beer' && entry.volumeLiters === 0.66) {
          summary.beer066 += entry.quantity;
          return;
        }

        if (entry.type === 'cocktail') {
          summary.cocktail += entry.quantity;
        }
      });

      callback(summary);
    },
    onError,
  );
}

export async function getUserDrinkHistory(userId, filter) {
  const historyQuery = query(
    collection(db, 'drinkEntries'),
    where('userId', '==', userId),
  );
  const snapshot = await getDocs(historyQuery);

  return snapshot.docs.map((entrySnapshot) => ({
    id: entrySnapshot.id,
    ...entrySnapshot.data(),
  }))
    .filter((entry) => matchesDrinkFilter(entry, filter))
    .sort((firstEntry, secondEntry) => {
      return getTimestampMillis(secondEntry) - getTimestampMillis(firstEntry);
    });
}

export function subscribeToRanking(callback, onError) {
  const rankingQuery = query(collection(db, 'userStats'), orderBy('points', 'desc'));

  return onSnapshot(
    rankingQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((statsSnapshot) => ({
          id: statsSnapshot.id,
          ...statsSnapshot.data(),
        })),
      );
    },
    onError,
  );
}

function matchesDrinkFilter(entry, filter) {
  if (entry.type !== filter.type) {
    return false;
  }

  if (filter.type !== 'beer') {
    return true;
  }

  return Number(entry.volumeLiters) === filter.volumeLiters;
}

function getTimestampMillis(entry) {
  const timestamp = entry.createdAt || entry.timestamp;

  if (!timestamp?.toMillis) {
    return 0;
  }

  return timestamp.toMillis();
}

function calculateStatDeltas(entries) {
  return entries.reduce(
    (deltas, entry) => {
      if (entry.type === 'beer' && entry.volumeLiters === 0.5) {
        deltas.beer05Total += entry.quantity;
        deltas.points += entry.quantity * pointWeights.beer05;
        return deltas;
      }

      if (entry.type === 'beer' && entry.volumeLiters === 0.66) {
        deltas.beer066Total += entry.quantity;
        deltas.points += entry.quantity * pointWeights.beer066;
        return deltas;
      }

      if (entry.type === 'cocktail') {
        deltas.cocktailTotal += entry.quantity;
        deltas.points += entry.quantity * pointWeights.cocktail;
      }

      return deltas;
    },
    {
      beer05Total: 0,
      beer066Total: 0,
      cocktailTotal: 0,
      points: 0,
    },
  );
}

function buildNextStats({
  currentStats,
  displayName,
  email,
  firstName,
  lastName,
  userId,
  statDeltas,
}) {
  const beer05Total = Number(currentStats.beer05Total || 0) + statDeltas.beer05Total;
  const beer066Total = Number(currentStats.beer066Total || 0) + statDeltas.beer066Total;
  const cocktailTotal =
    Number(currentStats.cocktailTotal || 0) + statDeltas.cocktailTotal;
  const points = roundPoints(Number(currentStats.points || 0) + statDeltas.points);

  return {
    userId,
    firstName,
    lastName,
    displayName,
    email,
    beer05Total,
    beer066Total,
    cocktailTotal,
    points,
    updatedAt: serverTimestamp(),
  };
}

function roundPoints(points) {
  return Math.round(points * 100) / 100;
}

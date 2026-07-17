import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig.js';

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

  const batch = writeBatch(db);
  const displayName =
    profile?.displayName || user.displayName || user.email || 'Utente senza nome';
  const [fallbackFirstName = '', fallbackLastName = ''] = displayName.split(' ');

  validEntries.forEach((entry) => {
    const entryRef = doc(collection(db, 'drinkEntries'));
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

    batch.set(entryRef, payload);
  });

  await batch.commit();
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

export function subscribeToRanking() {
  throw new Error('Ranking persistence is not implemented yet.');
}

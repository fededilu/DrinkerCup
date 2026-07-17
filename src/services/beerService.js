import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
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

export function subscribeToRanking() {
  throw new Error('Ranking persistence is not implemented yet.');
}

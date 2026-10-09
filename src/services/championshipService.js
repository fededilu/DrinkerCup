import {
  Timestamp,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig.js';

export const availableDrinks = [
  {
    key: 'beer033',
    title: 'Birra 0,33L',
    description: 'Formato valido: 0,33 litri.',
    type: 'beer',
    volumeLiters: 0.33,
    defaultPoints: 0.66,
  },
  {
    key: 'beer05',
    title: 'Birra 0,5L',
    description: 'Formato valido: 0,5 litri.',
    type: 'beer',
    volumeLiters: 0.5,
    defaultPoints: 1,
  },
  {
    key: 'beer066',
    title: 'Birra 0,66L',
    description: 'Formato valido: 0,66 litri.',
    type: 'beer',
    volumeLiters: 0.66,
    defaultPoints: 1.32,
  },
  {
    key: 'beer1',
    title: 'Birra 1L',
    description: 'Boccale o formato grande da 1 litro.',
    type: 'beer',
    volumeLiters: 1,
    defaultPoints: 2,
  },
  {
    key: 'wineGlass',
    title: 'Calice vino',
    description: 'Calice singolo di vino.',
    type: 'wine',
    defaultPoints: 0.8,
  },
  {
    key: 'spritz',
    title: 'Spritz',
    description: 'Aperitivo o spritz singolo.',
    type: 'spritz',
    defaultPoints: 1,
  },
  {
    key: 'cocktail',
    title: 'Cocktail',
    description: 'Conteggio cocktail consumati.',
    type: 'cocktail',
    defaultPoints: 1,
  },
  {
    key: 'shot',
    title: 'Shot',
    description: 'Cicchetto o shot singolo.',
    type: 'shot',
    defaultPoints: 0.5,
  },
  {
    key: 'amaro',
    title: 'Amaro',
    description: 'Amaro o digestivo singolo.',
    type: 'amaro',
    defaultPoints: 0.5,
  },
  {
    key: 'wineBottleHalf',
    title: 'Bottiglia di vino divisa',
    description: 'Mezza bottiglia conteggiata per giocatore.',
    type: 'wine',
    defaultPoints: 2,
  },
  {
    key: 'softDrink',
    title: 'Bevanda analcolica',
    description: 'Bevanda analcolica con punteggio negativo.',
    type: 'softDrink',
    defaultPoints: -0.5,
  },
];

export const CHAMPIONSHIP_ROLES = {
  ADMIN: 'ADMIN',
  PLAYER: 'PLAYER',
};

export function subscribeToUserChampionships(userId, callback, onError) {
  const championshipsQuery = query(
    collection(db, 'championships'),
    where('memberIds', 'array-contains', userId),
  );

  return onSnapshot(
    championshipsQuery,
    (snapshot) => {
      callback(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.status !== 'DELETED')
          .sort((first, second) => getTimestampMillis(second.createdAt) - getTimestampMillis(first.createdAt)),
      );
    },
    onError,
  );
}

export async function createChampionship({ user, profile, name, durationDays, drinks }) {
  const activeOwned = await getActiveOwnedChampionships(user.uid);

  if (activeOwned.length >= 2) {
    const error = new Error('Hai gia 2 campionati attivi.');
    error.code = 'active-championship-limit';
    throw error;
  }

  const enabledDrinks = drinks
    .filter((drink) => drink.enabled)
    .map((drink) => ({
      key: drink.key,
      title: drink.title,
      description: drink.description,
      type: drink.type,
      ...(drink.volumeLiters ? { volumeLiters: drink.volumeLiters } : {}),
      points: Number(drink.points),
    }));

  if (enabledDrinks.length === 0) {
    const error = new Error('Seleziona almeno un drink.');
    error.code = 'no-drinks';
    throw error;
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);
  const championshipRef = doc(collection(db, 'championships'));
  const displayName = profile?.displayName || user.displayName || user.email || '';
  const code = await generateAvailableCode();

  await runTransaction(db, async (transaction) => {
    transaction.set(championshipRef, {
      name: name.trim(),
      code,
      adminId: user.uid,
      adminEmail: user.email,
      adminDisplayName: displayName,
      drinkConfig: enabledDrinks,
      memberIds: [user.uid],
      memberRoles: {
        [user.uid]: CHAMPIONSHIP_ROLES.ADMIN,
      },
      memberCount: 1,
      status: 'ACTIVE',
      startsAt: Timestamp.fromDate(now),
      endsAt: Timestamp.fromDate(endsAt),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(db, 'championshipStats', buildStatsId(championshipRef.id, user.uid)), {
      championshipId: championshipRef.id,
      userId: user.uid,
      displayName,
      email: user.email,
      points: 0,
      drinkTotals: buildEmptyDrinkTotals(enabledDrinks),
      updatedAt: serverTimestamp(),
    });
  });

  return championshipRef.id;
}

export async function joinChampionshipByCode({ user, profile, code }) {
  const normalizedCode = code.trim().toUpperCase();
  const championshipsQuery = query(
    collection(db, 'championships'),
    where('code', '==', normalizedCode),
    limit(1),
  );
  const snapshot = await getDocs(championshipsQuery);

  if (snapshot.empty) {
    const error = new Error('Campionato non trovato.');
    error.code = 'championship-not-found';
    throw error;
  }

  const championshipDoc = snapshot.docs[0];
  const championship = championshipDoc.data();

  if (championship.status === 'DELETED') {
    const error = new Error('Campionato non trovato.');
    error.code = 'championship-not-found';
    throw error;
  }

  await joinChampionship({ user, profile, championshipId: championshipDoc.id });

  return championshipDoc.id;
}

export async function joinChampionship({ user, profile, championshipId }) {
  const championshipRef = doc(db, 'championships', championshipId);
  const statsRef = doc(db, 'championshipStats', buildStatsId(championshipId, user.uid));
  const displayName = profile?.displayName || user.displayName || user.email || '';

  await runTransaction(db, async (transaction) => {
    const championshipSnapshot = await transaction.get(championshipRef);

    if (!championshipSnapshot.exists()) {
      const error = new Error('Campionato non trovato.');
      error.code = 'championship-not-found';
      throw error;
    }

    const championship = championshipSnapshot.data();

    if (championship.status === 'DELETED') {
      const error = new Error('Campionato non trovato.');
      error.code = 'championship-not-found';
      throw error;
    }

    const memberIds = championship.memberIds || [];
    const memberRoles = championship.memberRoles || {};
    const statsSnapshot = await transaction.get(statsRef);

    if (!memberIds.includes(user.uid)) {
      transaction.update(championshipRef, {
        memberIds: [...memberIds, user.uid],
        memberRoles: {
          ...memberRoles,
          [user.uid]: memberRoles[user.uid] || CHAMPIONSHIP_ROLES.PLAYER,
        },
        memberCount: Number(championship.memberCount || memberIds.length) + 1,
        updatedAt: serverTimestamp(),
      });
    }

    if (!statsSnapshot.exists()) {
      transaction.set(statsRef, {
        championshipId,
        userId: user.uid,
        displayName,
        email: user.email,
        points: 0,
        drinkTotals: buildEmptyDrinkTotals(championship.drinkConfig || []),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export function subscribeToChampionship(championshipId, callback, onError) {
  return onSnapshot(
    doc(db, 'championships', championshipId),
    (snapshot) => {
      callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    onError,
  );
}

export async function removeChampionshipMembers({ user, championshipId }) {
  const championshipRef = doc(db, 'championships', championshipId);

  await runTransaction(db, async (transaction) => {
    const championshipSnapshot = await transaction.get(championshipRef);

    if (!championshipSnapshot.exists()) {
      const error = new Error('Campionato non trovato.');
      error.code = 'championship-not-found';
      throw error;
    }

    const championship = championshipSnapshot.data();

    if (!isChampionshipAdmin(championship, user.uid)) {
      const error = new Error('Operazione non autorizzata.');
      error.code = 'permission-denied';
      throw error;
    }

    transaction.update(championshipRef, {
      memberIds: [],
      memberCount: 0,
      status: 'DELETED',
      deletedAt: serverTimestamp(),
      deletedBy: user.uid,
      updatedAt: serverTimestamp(),
    });
  });
}

async function getActiveOwnedChampionships(userId) {
  const activeQuery = query(
    collection(db, 'championships'),
    where('adminId', '==', userId),
  );
  const snapshot = await getDocs(activeQuery);

  return snapshot.docs
    .map((item) => item.data())
    .filter((item) => item.status !== 'DELETED' && getTimestampMillis(item.endsAt) > Date.now());
}

export function getChampionshipRole(championship, userId) {
  if (!championship || !userId) {
    return '';
  }

  return championship.memberRoles?.[userId] || (
    championship.adminId === userId ? CHAMPIONSHIP_ROLES.ADMIN : CHAMPIONSHIP_ROLES.PLAYER
  );
}

export function isChampionshipAdmin(championship, userId) {
  return getChampionshipRole(championship, userId) === CHAMPIONSHIP_ROLES.ADMIN;
}

async function generateAvailableCode() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateCode();
    const existing = await getDocs(
      query(collection(db, 'championships'), where('code', '==', code), limit(1)),
    );

    if (existing.empty) {
      return code;
    }
  }

  throw new Error('Impossibile generare un codice invito.');
}

function generateCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join('');
}

function buildStatsId(championshipId, userId) {
  return `${championshipId}_${userId}`;
}

function buildEmptyDrinkTotals(drinks) {
  return drinks.reduce((totals, drink) => ({ ...totals, [drink.key]: 0 }), {});
}

function getTimestampMillis(timestamp) {
  return timestamp?.toMillis ? timestamp.toMillis() : 0;
}

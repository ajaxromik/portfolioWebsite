import { db } from '../firebase';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

export const MAX_DECKS_PER_USER = 15;
export const MAX_CARDS_PER_DECK = 75;
export const MAX_CARD_TEXT_LENGTH = 400;

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function requireUid(uid) {
  if (!uid) throw new Error('No user ID provided');
}

function userRef(uid) {
  return doc(db, 'users', uid);
}

function decksCol(uid) {
  return collection(db, 'users', uid, 'decks');
}

function deckRef(uid, deckId) {
  return doc(db, 'users', uid, 'decks', deckId);
}

function cardsCol(uid, deckId) {
  return collection(db, 'users', uid, 'decks', deckId, 'cards');
}

function cardRef(uid, deckId, cardId) {
  return doc(db, 'users', uid, 'decks', deckId, 'cards', cardId);
}

// Legacy proof-of-concept helper (kept for compatibility while the old view exists).
export const saveUserPreferences = async (uid, preferences) => {
  if (!uid) throw new Error('No user ID provided');
  const legacyRef = doc(db, 'userData', uid);
  return setDoc(legacyRef, { lastLogin: new Date(), ...preferences }, { merge: true });
};

export async function upsertUserProfile(firebaseUser) {
  if (!firebaseUser?.uid) throw new Error('No user provided');

  const ref = userRef(firebaseUser.uid);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const base = {
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
    };

    if (!snap.exists()) {
      tx.set(ref, {
        ...base,
        createdAt: serverTimestamp(),
        deckCount: 0,
      });
      return;
    }

    tx.set(ref, base, { merge: true });
  });
}

export function listenUserProfile(uid, onChange, onError) {
  requireUid(uid);
  return onSnapshot(
    userRef(uid),
    (snap) => {
      onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    onError
  );
}

export async function getUserProfile(uid) {
  requireUid(uid);
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function listenDecks(uid, onChange, onError) {
  requireUid(uid);
  const q = query(decksCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const decks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(decks);
    },
    onError
  );
}

export async function listDecks(uid) {
  requireUid(uid);
  const q = query(decksCol(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createDeck(uid, { title, description }) {
  requireUid(uid);
  const uRef = userRef(uid);
  const newDeckRef = doc(decksCol(uid));

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(uRef);
    if (!userSnap.exists()) throw new Error('User profile missing');
    const currentDeckCount = Number(userSnap.data().deckCount || 0);
    if (currentDeckCount >= MAX_DECKS_PER_USER) throw new Error('DECK_LIMIT');

    tx.set(newDeckRef, {
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      createdAt: serverTimestamp(),
      cardCount: 0,
    });

    tx.update(uRef, { deckCount: currentDeckCount + 1 });
  });

  return newDeckRef.id;
}

export async function renameDeck(uid, deckId, { title, description }) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');
  const ref = deckRef(uid, deckId);
  return updateDoc(ref, {
    title: String(title || '').trim(),
    description: String(description || '').trim(),
  });
}

export async function deleteDeck(uid, deckId) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');

  // Delete cards in pages, decrementing cardCount as we go.
  // (Client-side recursive delete; safe for small caps like 75.)
  while (true) {
    const page = await getDocs(query(cardsCol(uid, deckId), orderBy('createdAt', 'asc'), limit(400)));
    if (page.empty) break;

    const cardIds = page.docs.map((d) => d.id);
    await runTransaction(db, async (tx) => {
      const dRef = deckRef(uid, deckId);
      const deckSnap = await tx.get(dRef);
      if (!deckSnap.exists()) throw new Error('Deck missing');

      const currentCount = Number(deckSnap.data().cardCount || 0);
      const nextCount = Math.max(0, currentCount - cardIds.length);
      tx.update(dRef, { cardCount: nextCount });

      for (const id of cardIds) {
        tx.delete(cardRef(uid, deckId, id));
      }
    });
  }

  // Now delete the deck doc (requires cardCount == 0 per rules) and decrement user deckCount.
  await runTransaction(db, async (tx) => {
    const uRef = userRef(uid);
    const dRef = deckRef(uid, deckId);

    const [userSnap, deckSnap] = await Promise.all([tx.get(uRef), tx.get(dRef)]);
    if (!userSnap.exists()) throw new Error('User missing');
    if (!deckSnap.exists()) return;

    const currentDeckCount = Number(userSnap.data().deckCount || 0);
    const currentCardCount = Number(deckSnap.data().cardCount || 0);
    if (currentCardCount !== 0) throw new Error('DECK_NOT_EMPTY');

    tx.delete(dRef);
    tx.update(uRef, { deckCount: Math.max(0, currentDeckCount - 1) });
  });
}

export function listenCards(uid, deckId, onChange, onError) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');

  const q = query(cardsCol(uid, deckId), orderBy('dueDate', 'asc'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(cards);
    },
    onError
  );
}

export async function bulkCreateCards(uid, deckId, cards) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');
  const list = Array.isArray(cards) ? cards : [];
  if (list.length === 0) return [];

  const createdIds = [];

  await runTransaction(db, async (tx) => {
    const dRef = deckRef(uid, deckId);
    const deckSnap = await tx.get(dRef);
    if (!deckSnap.exists()) throw new Error('Deck missing');

    const currentCount = Number(deckSnap.data().cardCount || 0);
    if (currentCount + list.length > MAX_CARDS_PER_DECK) throw new Error('CARD_LIMIT');

    tx.update(dRef, { cardCount: currentCount + list.length });

    for (const raw of list) {
      const front = String(raw?.front || '').slice(0, MAX_CARD_TEXT_LENGTH);
      const back = String(raw?.back || '').slice(0, MAX_CARD_TEXT_LENGTH);
      const nowTs = Timestamp.now();

      const cRef = doc(cardsCol(uid, deckId));
      createdIds.push(cRef.id);
      tx.set(cRef, {
        front,
        back,
        interval: 0,
        ease: 2.5,
        streak: 0,
        dueDate: nowTs,
        createdAt: nowTs,
      });
    }
  });

  return createdIds;
}

export async function updateCard(uid, deckId, cardId, patch) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');
  if (!cardId) throw new Error('No card ID provided');
  const ref = cardRef(uid, deckId, cardId);
  return updateDoc(ref, patch);
}

export async function bulkUpdateCards(uid, deckId, patches) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');

  const list = Array.isArray(patches) ? patches : [];
  if (list.length === 0) return;

  // Firestore batch limit is 500 writes.
  for (const group of chunk(list, 450)) {
    const batch = writeBatch(db);
    for (const p of group) {
      if (!p?.cardId) continue;
      batch.update(cardRef(uid, deckId, p.cardId), p.patch || {});
    }
    await batch.commit();
  }
}

export async function deleteCard(uid, deckId, cardId) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');
  if (!cardId) throw new Error('No card ID provided');

  await runTransaction(db, async (tx) => {
    const dRef = deckRef(uid, deckId);
    const cRef = cardRef(uid, deckId, cardId);

    const deckSnap = await tx.get(dRef);
    if (!deckSnap.exists()) throw new Error('Deck missing');

    const currentCount = Number(deckSnap.data().cardCount || 0);
    const nextCount = Math.max(0, currentCount - 1);

    tx.update(dRef, { cardCount: nextCount });
    tx.delete(cRef);
  });
}

export async function getDeck(uid, deckId) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');
  const snap = await getDoc(deckRef(uid, deckId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Convenience for setting cardCount directly (used cautiously by UI flows).
export async function setDeckCardCount(uid, deckId, nextCount) {
  requireUid(uid);
  if (!deckId) throw new Error('No deck ID provided');
  return updateDoc(deckRef(uid, deckId), { cardCount: nextCount });
}

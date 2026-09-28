import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig.js';

export async function registerWithEmail({ email, password, firstName, lastName }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

  await updateProfile(userCredential.user, { displayName });

  await saveUserProfile(userCredential.user, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    displayName,
  });

  return userCredential;
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const userCredential = await signInWithPopup(auth, provider);
  await saveUserProfile(userCredential.user);

  return userCredential;
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function logout() {
  return signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

async function saveUserProfile(user, profile = {}) {
  const displayName = profile.displayName || user.displayName || '';
  const [fallbackFirstName = '', ...fallbackLastNameParts] = displayName.split(' ');
  const fallbackLastName = fallbackLastNameParts.join(' ');
  const userRef = doc(db, 'users', user.uid);
  const userSnapshot = await getDoc(userRef);

  await setDoc(
    userRef,
    {
      uid: user.uid,
      firstName: profile.firstName ?? fallbackFirstName,
      lastName: profile.lastName ?? fallbackLastName,
      displayName: displayName || user.email || '',
      email: user.email,
      ...(!userSnapshot.exists() ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

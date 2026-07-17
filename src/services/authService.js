import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig.js';

export async function registerWithEmail({ email, password, firstName, lastName }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

  await updateProfile(userCredential.user, { displayName });

  await setDoc(doc(db, 'users', userCredential.user.uid), {
    uid: userCredential.user.uid,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    displayName,
    email: userCredential.user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return userCredential;
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
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

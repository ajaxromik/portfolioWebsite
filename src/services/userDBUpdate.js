import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export const saveUserPreferences = async (uid, preferences) => {
  if (!uid) throw new Error("No user ID provided");

  const userRef = doc(db, 'userData', uid);
  
  // Return the promise so the component can await it
  return setDoc(userRef, {
    lastLogin: new Date(),
    ...preferences
  }, { merge: true });
};

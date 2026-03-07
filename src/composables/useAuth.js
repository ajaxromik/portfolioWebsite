import { ref } from 'vue';
import { auth } from '../firebase';
import { 
    onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithRedirect, getRedirectResult,
    signInWithPopup, signOut 
} from 'firebase/auth';
import { upsertUserProfile } from '../services/userDBUpdate';

// Define state outside the export so it acts as a global singleton
const user = ref(null);
const loading = ref(true);
let initPromise = null;
let hasInitializedListener = false;
const upsertedUids = new Set();

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function isLocalhostHost() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function isSessionExpired(currentUser) {
  if (!currentUser?.metadata?.lastSignInTime) return false;
  const lastSignInMs = new Date(currentUser.metadata.lastSignInTime).getTime();
  if (!Number.isFinite(lastSignInMs)) return false;
  return Date.now() - lastSignInMs > TWO_WEEKS_MS;
}

export function useAuth() {
  
    const initAuth = async () => {
        if (initPromise) return initPromise;

        initPromise = (async () => {
          loading.value = true;

          try {
            if (!isLocalhostHost()) {
              const result = await getRedirectResult(auth);
              if (result?.user) user.value = result.user;
            }
          } catch (error) {
            console.error("Redirect Error:", error?.code, error?.message);
            if (error?.code === 'auth/internal-error') {
              alert("Sign-in blocked. Please disable ad-blockers for this site.");
            }
          }

          if (hasInitializedListener) return;
          hasInitializedListener = true;

          await new Promise((resolve) => {
            onAuthStateChanged(auth, async (currentUser) => {
              try {
                if (currentUser) {
                  if (!currentUser.isAnonymous && isSessionExpired(currentUser)) {
                    await signOut(auth);
                    user.value = null;
                    loading.value = false;
                    resolve();
                    return;
                  }

                  user.value = currentUser;
                  loading.value = false;
                  resolve();

                  if (!currentUser.isAnonymous && !upsertedUids.has(currentUser.uid)) {
                    try {
                      await upsertUserProfile(currentUser);
                      upsertedUids.add(currentUser.uid);
                    } catch (e) {
                      console.error('Failed to upsert user profile:', e);
                    }
                  }
                } else {
                  // Keep anonymous auth so the rest of the site works without forcing sign-in.
                  try {
                    await signInAnonymously(auth);
                  } catch (err) {
                    console.error("Anon Auth failed:", err);
                  } finally {
                    loading.value = false;
                    resolve();
                  }
                }
              } catch (err) {
                console.error('Auth state processing failed:', err);
                loading.value = false;
                resolve();
              }
            });
          });
        })();

        return initPromise;
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            if (import.meta.env.DEV) {
                // use popup for local development because redirects don't handle localhost easily
                const result = await signInWithPopup(auth, provider);
                user.value = result.user;
                if (result.user && !result.user.isAnonymous && !upsertedUids.has(result.user.uid)) {
                    await upsertUserProfile(result.user);
                    upsertedUids.add(result.user.uid);
                }
            } else {
                await signInWithRedirect(auth, provider);
            }
        } catch (error) {
            console.error("Google sign-in failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            // Clear the cache so a re-login triggers upsertUserProfile again
            upsertedUids.clear();
        } catch (error) {
            console.error("Logout failed:", error);
            throw error; 
        }
    };

    return { user, loading, initAuth, signInWithGoogle, logout };
}

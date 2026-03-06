import { ref } from 'vue';
import { auth } from '../firebase';
import { 
    onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithRedirect, getRedirectResult,
    signInWithPopup, signOut 
} from 'firebase/auth';

// Define state outside the export so it acts as a global singleton
const user = ref(null);
const loading = ref(true);

export function useAuth() {
  
    const initAuth = async () => {
        try {
            if (window.location.hostname !== 'localhost' || window.location.hostname !== '127.0.0.1') {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    user.value = result.user;
                }
            }
        } catch (error) {
            console.error("Redirect Error:", error.code, error.message);
            if (error.code === 'auth/internal-error') {
                alert("Sign-in blocked. Please disable ad-blockers for this site.");
        }
        }

        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                user.value = currentUser;
                loading.value = false;
            } else {
                signInAnonymously(auth).catch(err => {
                    console.error("Anon Auth failed:", err);
                    loading.value = false;
                });
            }
        });
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            if (import.meta.env.DEV) {
                // use popup for local development because redirects don't handle localhost easily
                const result = await signInWithPopup(auth, provider);
                user.value = result.user;
            } else {
                await signInWithRedirect(auth, provider);
            }
        } catch (error) {
            console.error("Google sign-in failed:", error);
        }
    };

    const logout = () => signOut(auth);

    return { user, loading, initAuth, signInWithGoogle, logout };
}

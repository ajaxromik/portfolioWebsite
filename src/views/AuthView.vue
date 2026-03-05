<script setup>
import { ref, onMounted } from 'vue';
import { auth, db } from '../firebase'; 
import { doc, setDoc } from 'firebase/firestore';
import { 
  onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithRedirect, signOut, getRedirectResult
} from 'firebase/auth';

const user = ref(null);
const loading = ref(true);

onMounted(async () => {
    // Handle sign in redirect
    try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
            user.value = result.user;
        }
    } catch (error) {
        console.error("Redirect Error:", error.code, error.message);
        if (error.code === 'auth/internal-error') { //TODO: get rid of all alerts
            alert("Sign-in blocked. Please disable ad-blockers for this site.");
        }
    }

    onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            user.value = currentUser;
            loading.value = false;
        } else {
            // Create an anonymous session to allow updating click button
            signInAnonymously(auth).catch(err => {
                console.error("Anon Auth failed:", err);
                loading.value = false;
            });
        }
    });
});

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error("Google sign-in failed:", error);
  }
};

// Data tied to this user's UID
const saveUserData = async () => {
  if (!user.value || user.value.isAnonymous) return;

  try {
    // We strictly use the user's UID as the document name
    const userRef = doc(db, 'userData', user.value.uid);
    await setDoc(userRef, {
      lastLogin: new Date(),
      favoriteColor: 'blue' // Example data
    }, { merge: true });
    alert("Private data saved!");
  } catch (error) {
    console.error("Failed to save data:", error);
    alert("Security Rules blocked the request or an error occurred.");
  }
};

const logout = () => signOut(auth);
</script>

<template>
        
    <div class="auth-containerbg-new-light text-new-dark flex-grow-1 d-flex flex-column">
        <p class="py-4"></p>
        <h2 v-if="loading">Checking session...</h2>
        <div v-else>
            <div v-if="user && !user.isAnonymous">
                <h3>Welcome, {{ user.displayName }}!</h3>
                <p><strong>Your Database ID:</strong> {{ user.uid }}</p>
                <button @click="saveUserData">Save My Private Data</button>
                <button @click="logout" class="logout-btn">Log Out</button>
            </div>

            <div v-else>
                <h3>Welcome!</h3>
                <p>You are browsing anonymously. Sign in to save your data.</p>
                <button @click="signInWithGoogle">Sign in with Google</button>
            </div>
        </div>
    </div>
</template>

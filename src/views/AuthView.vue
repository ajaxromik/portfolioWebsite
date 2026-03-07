<script setup>
import FlashcardSystem from '../components/FlashcardSystem.vue';
import { useAuth } from '../composables/useAuth';
import { saveUserPreferences } from '../services/userDBUpdate';

// TODO: rename this file and other files with bad naming
// Pull in exactly what you need from the composable
const { user, loading, signInWithGoogle, logout } = useAuth();

// Component-specific logic for handling the save action
const handleSave = async () => {
  if (!user.value || user.value.isAnonymous) return;

  try {
    await saveUserPreferences(user.value.uid, { favoriteColor: 'blue' });
    alert("Private data saved!");
  } catch (error) {
    console.error("Failed to save data:", error);
    alert("Security Rules blocked the request or an error occurred.");
  }
};

</script>

<template>
    <div class="auth-container bg-new-light text-new-dark flex-grow-1 d-flex flex-column">
        <h2 v-if="loading">Checking session...</h2>
        <div v-else>
            <div v-if="user && !user.isAnonymous">
                <h3>Welcome, {{ user.displayName }}!</h3>
                <p><strong>Your Database ID:</strong> {{ user.uid }}</p>
                <button @click="handleSave">Save My Private Data</button>
                <button @click="logout" class="logout-btn">Log Out</button>
            </div>

            <div v-else>
                <h3>Welcome!</h3>
                <p>You are browsing anonymously. Sign in to save your data.</p>
                <button @click="signInWithGoogle">Sign in with Google</button>
            </div>
        </div>
        <div class="">
            <FlashcardSystem />
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const route = useRoute();

const { user, loading, signInWithGoogle } = useAuth();
const isSigningIn = ref(false);
const errorMessage = ref('');

const isSignedIn = computed(() => !!user.value && !user.value.isAnonymous);

watch(
  isSignedIn,
  (signedIn) => {
    if (!signedIn) return;
    const redirectTo = typeof route.query.redirect === 'string' ? route.query.redirect : '/flashcards/decks';
    router.replace(redirectTo);
  },
  { immediate: true }
);

const handleGoogle = async () => {
  errorMessage.value = '';
  isSigningIn.value = true;
  try {
    await signInWithGoogle();
    // In prod, redirect flow navigates away; in dev popup, watcher will redirect after user updates.
  } catch (e) {
    console.error(e);
    errorMessage.value = 'Sign-in failed. Please try again.';
  } finally {
    isSigningIn.value = false;
  }
};
</script>

<template>
  <div class="bg-new-light text-new-dark flex-grow-1 d-flex flex-column">
    <section class="landing-section d-flex align-items-center bg-light pt-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-12 col-md-9 col-lg-6">
            <div class="card border-0 shadow-sm">
              <div class="card-body p-4 p-md-5">
                <h1 class="h3 fw-bold mb-2">Flashcards login</h1>
                <p class="text-secondary mb-4">
                  Sign in with Google to create decks and sync your progress.
                </p>

                <button
                  class="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                  type="button"
                  :disabled="loading || isSigningIn"
                  @click="handleGoogle"
                >
                  <span v-if="loading || isSigningIn" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>{{ loading || isSigningIn ? 'Connecting...' : 'Continue with Google' }}</span>
                </button>

                <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0" role="alert">
                  {{ errorMessage }}
                </div>

                <div class="mt-4 d-flex justify-content-between align-items-center">
                  <router-link to="/flashcards" class="btn btn-link px-0">Back</router-link>
                  <small class="text-muted">Google is the only sign-in option.</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useAuth } from '../composables/useAuth';
import FlashcardSystem from '../components/FlashcardSystem.vue';

const { user, loading } = useAuth();

const isSignedIn = computed(() => !!user.value && !user.value.isAnonymous);
</script>

<template>
  <div class="bg-new-light text-new-dark flex-grow-1 d-flex flex-column">
    <section class="landing-section d-flex align-items-center bg-light text-center pt-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-12 col-lg-9">
            <h1 class="display-4 fw-bold">Flashcards (Spaced Repetition)</h1>
            <p class="lead text-secondary mb-4">
              A simple, research-based review flow: cards become due over time, and your rating adjusts when you’ll see them next.
            </p>
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <router-link v-if="isSignedIn" to="/flashcards/decks" class="btn btn-primary btn-lg">
                Go to my decks
              </router-link>
              <router-link v-else to="/flashcards/login" class="btn btn-primary btn-lg" :class="{ disabled: loading }">
                Log in to create decks
              </router-link>
              <router-link to="/experience" class="btn btn-outline-secondary btn-lg">Back to portfolio</router-link>
            </div>
            <div v-if="loading" class="mt-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-5 bg-new-light">
      <div class="container text-center">
        <h2 class="fw-bold mb-4">Try a quick demo</h2>
        <p class="text-secondary mb-4">
          This demo uses the same review UI you'll use in your own decks.
        </p>
        <FlashcardSystem />
      </div>
    </section>

    <section class="py-5 bg-light">
      <div class="container text-center">
        <h2 class="fw-bold mb-3">Create your own decks</h2>
        <p class="fs-5 text-secondary mb-4">
          Sign in with Google to build decks, add cards, and review on a schedule.
        </p>
        <router-link to="/flashcards/login" class="btn btn-success btn-lg" :class="{ disabled: loading }">
          Log in
        </router-link>
      </div>
    </section>
  </div>
</template>


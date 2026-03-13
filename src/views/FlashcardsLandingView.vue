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
          <div class="col-9">
            <h1 class="display-4 fw-bold">Flashcards Anywhere</h1>
            <h4 class="text-secondary fw-normal">
              A free, flashcard application (unlike Quizlet) that links to any Google account.
              <br class="d-none d-xl-block" />
              I built it with a Spaced Repetition System to order the cards effectively.
              <br class="d-none d-xl-block" />
              More features to come soon.
            </h4>
            <h5 class="fw-normal text-secondary mb-4">
              None of your information is used, besides the bare minimum to link to your Google Account.
            </h5>
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <router-link v-if="isSignedIn" to="/flashcards/decks" class="btn btn-primary btn-lg">
                Go to my decks
              </router-link>
              <router-link v-else to="/flashcards/login" class="btn btn-primary btn-lg" :class="{ disabled: loading }">
                Login to Start
              </router-link>
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
      <div class="container text-center d-flex flex-column justify-content-center align-items-center">
        <h2 class="fw-bold mb-4">Try a quick demo</h2>
        <div class="bg-light rounded-3 px-4 mb-4 pt-2 pb-3 w-75">
          <p class="text-secondary fs-5 fw-semibold mt-0 mb-1">The keyboard can control the cards too.</p>
          <p class="text-secondary text-start mb-0">
            <kbd>Spacebar</kbd> flips the card.
            <br />
            <kbd>E</kbd> marks the card as easy, meaning that you remembered it easily.
            <br />
            <kbd>K</kbd> marks the card as "kinda", meaning that you only kind of remembered it.
            <br />
            <kbd>F</kbd> marks the card as forgotten.
          </p>
        </div>
      </div>
      <div class="container text-center mb-4 d-flex flex-column justify-content-center align-items-center">
        <FlashcardSystem />
      </div>
      <div class="container text-center d-flex flex-column justify-content-center align-items-center">
        <p class="text-secondary w-75">
          This is a demo based on the UI of the app.
          <br />
          For each card: read the front, recall what was on the back, flip the card, and select how well you recalled what was on the back.
        </p>
      </div>
    </section>

    <section class="py-5 bg-light">
      <div class="container text-center d-flex flex-column justify-content-center align-items-center w-75">
        <h2 class="fw-bold mb-3">Based on Learning Optimization Science</h2>
        <p class="fs-5 text-secondary mb-4">
          If you're curious about the math behind the algorithm, you can check out the <a href="https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method" target="_blank" rel="noopener">SuperMemo-2 Algorithm Documentation</a>.
          I came across this method while improving my studying skills, and I found the topic quite interesting.
          Another source that can show practical applications of learning science would be <i>Fluent Forever</i> by Gabriel Wyner.
        </p>
      </div>
    </section>
  </div>
</template>


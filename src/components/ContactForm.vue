<script setup>
import { ref, computed } from 'vue';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// TODO: add throttling to the form
// TODO: add a simple counter input
// TODO: reformat title and add custom hover class to this file?

const ALLOWED_ASPECTS = ['Projects', 'Certifications', 'Jobs'];
const ALLOWED_AREAS = [
  'Cybersecurity',
  'OOP',
  'Database Design',
  'Full-Stack',
  'Another Language/Technology'
];

const selectedAspect = ref('');
const selectedArea = ref('');
const isSubmitting = ref(false);
const feedback = ref(null);
const feedbackType = ref('success');

const feedbackClass = computed(() => {
  return feedbackType.value === 'success' ? 'alert-success' : 'alert-danger';
});

// Pre-Validation: Ensure the selected values strictly exist in our allowed arrays
const isValid = computed(() => {
  return ALLOWED_ASPECTS.includes(selectedAspect.value) && ALLOWED_AREAS.includes(selectedArea.value);
});

const submitAdvice = async () => {
  // return if validation fails
  if (!isValid.value) {
    feedbackType.value = 'error';
    feedback.value = 'Invalid selection detected. Please use the provided options.';
    return;
  }

  isSubmitting.value = true;
  feedback.value = null;

  try {
    const adviceRef = collection(db, 'career_advice');

    await addDoc(adviceRef, {
      aspect: selectedAspect.value,
      area: selectedArea.value,
      createdAt: serverTimestamp()
    });

    selectedAspect.value = '';
    selectedArea.value = '';
    feedbackType.value = 'success';
    feedback.value = 'Thanks for the guidance!';
    setTimeout(() => {feedback.value = null;}, 3000);

  } catch (error) {
    console.error("Error adding document: ", error);
    feedbackType.value = 'error';
    feedback.value = 'Something went wrong. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="card shadow-sm mb-4">
    <div class="card-body text-secondary">
      <h2 class="card-title mb-3 border-bottom border-light-blue pb-1">Help Me Choose My Next Step</h2>

      <form @submit.prevent="submitAdvice">

        <div class="mb-4">
          <label class="form-label">What aspect should I focus on?</label>
          <div class="d-flex flex-wrap gap-2">
            <template v-for="(aspect, index) in ALLOWED_ASPECTS" :key="aspect">
              <input
                type="radio"
                class="btn-check form-control-large"
                name="cs-aspect"
                :id="`aspect-${index}`"
                :value="aspect"
                v-model="selectedAspect"
                required
                :disabled="isSubmitting"
              >
              <label class="btn btn-outline-primary rounded-pill" :for="`aspect-${index}`">
                {{ aspect }}
              </label>
            </template>
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label text-secondary">In what area of Computer Science?</label>
          <div class="d-flex flex-wrap gap-2">
            <template v-for="(area, index) in ALLOWED_AREAS" :key="area">
              <input
                type="radio"
                class="btn-check"
                name="cs-area"
                :id="`area-${index}`"
                :value="area"
                v-model="selectedArea"
                required
                :disabled="isSubmitting"
              >
              <label class="btn btn-outline-primary rounded-pill" :for="`area-${index}`">
                {{ area }}
              </label>
            </template>
          </div>
        </div>

        <p class="mb-4 text-secondary">
          I could not leave a text box here unfortunately as much as I believe in all users of the internet to keep my pages looking professional, but hopefully you found my site informational.
          <br>
          If you would like to reach out, please contact me via LinkedIn.
        </p>

        <button type="submit" class="btn btn-light-blue" :disabled="isSubmitting || !isValid">
          {{ isSubmitting ? 'Submitting...' : 'Let me know!' }}
        </button>

        <div v-if="feedback" class="mt-3 alert" :class="feedbackClass" role="alert">
          {{ feedback }}
        </div>

      </form>
    </div>
  </div>
</template>
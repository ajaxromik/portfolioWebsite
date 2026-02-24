<script setup>
import { ref, computed } from 'vue';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 

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
    <div class="card-body">
      <h3 class="card-title mb-4">Help Me Choose My Next Step</h3>
      
      <form @submit.prevent="submitAdvice">
        
        <div class="mb-4">
          <label class="form-label fw-bold">What aspect should I focus on?</label>
          <div v-for="aspect in ALLOWED_ASPECTS" :key="aspect" class="form-check">
            <input 
              class="form-check-input" 
              type="radio" 
              :id="`aspect-${aspect}`" 
              :value="aspect" 
              v-model="selectedAspect"
              required
              :disabled="isSubmitting"
            >
            <label class="form-check-label" :for="`aspect-${aspect}`">
              {{ aspect }}
            </label>
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label fw-bold d-block">In what area of Computer Science?</label>
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

        <button type="submit" class="btn btn-success" :disabled="isSubmitting || !isValid">
          {{ isSubmitting ? 'Submitting...' : 'let me know!' }}
        </button>

        <div v-if="feedback" class="mt-3 alert" :class="feedbackClass" role="alert">
          {{ feedback }}
        </div>

      </form>
    </div>
  </div>
</template>
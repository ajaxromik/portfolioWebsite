<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const deck = ref(
  Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    front: `Mock Question ${i + 1}`,
    back: `Mock Answer ${i + 1}`,
    interval: 0,
    ease: 2.5,
    streak: 0,
    dueDate: Date.now() - ONE_DAY_MS
  }))
);

const isReviewing = ref(false);
const isFlipped = ref(false); 
const hasFlipped = ref(false);
const reviewQueue = ref([]);
const currentCardIndex = ref(0);
const MAX_CARDS_PER_SESSION = 25;

const cardsDue = computed(() => {
  const now = Date.now();
  return deck.value
    .filter(card => card.dueDate <= now)
    .sort((a, b) => a.dueDate - b.dueDate);
});

const dueCardsTotal = computed(() => cardsDue.value.length);
const currentCard = computed(() => reviewQueue.value[currentCardIndex.value]);

const progressPercentage = computed(() => {
  if (reviewQueue.value.length === 0) return 0;
  return ((currentCardIndex.value + 1) / reviewQueue.value.length) * 100;
});

const formattedNextReview = computed(() => {
  const futureCards = deck.value.filter(card => card.dueDate > Date.now());
  if (futureCards.length === 0) return null;
  
  futureCards.sort((a, b) => a.dueDate - b.dueDate);
  const nextDate = new Date(futureCards[0].dueDate);
  
  const datePart = nextDate.toLocaleDateString();
  const timePart = nextDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return `${datePart} at ${timePart}`;
});

const handleKeydown = (event) => {
  if (!isReviewing.value) return;

  if (event.code === 'Space') {
    event.preventDefault();
    flipCard();
  }

  if (hasFlipped.value) {
    const key = event.key.toLowerCase();
    if (key === 'e') handleRating('easy');
    if (key === 'k') handleRating('kinda'); 
    if (key === 'f') handleRating('forgot');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const startReview = () => {
  if (dueCardsTotal.value > 0) {
    reviewQueue.value = cardsDue.value.slice(0, MAX_CARDS_PER_SESSION);
  } else {
    const upcomingCards = [...deck.value].sort((a, b) => a.dueDate - b.dueDate);
    reviewQueue.value = upcomingCards.slice(0, MAX_CARDS_PER_SESSION);
  }
  
  currentCardIndex.value = 0;
  isFlipped.value = false;
  hasFlipped.value = false;
  isReviewing.value = true;
};

const flipCard = () => {
  isFlipped.value = !isFlipped.value;
  hasFlipped.value = true;
};

const handleRating = (rating) => {
  const card = currentCard.value;
  
  if (rating === 'forgot') {
    card.streak = 0;
    card.interval = 1;
    card.ease = Math.max(1.3, card.ease - 0.2);
  } else if (rating === 'kinda') { 
    if (card.streak === 0) card.interval = 1;
    else if (card.streak === 1) card.interval = 3;
    else card.interval = Math.ceil(card.interval * card.ease);
    card.streak += 1;
  } else if (rating === 'easy') {
    if (card.streak === 0) card.interval = 4;
    else card.interval = Math.ceil(card.interval * card.ease * 1.3);
    card.streak += 1;
    card.ease += 0.15;
  }

  card.dueDate = Date.now() + (card.interval * ONE_DAY_MS);
  nextCard();
};

const nextCard = () => {
  isFlipped.value = false;
  hasFlipped.value = false;
  
  if (currentCardIndex.value < reviewQueue.value.length - 1) {
    currentCardIndex.value++;
  } else {
    isReviewing.value = false;
    reviewQueue.value = [];
  }
};
</script>

<template>
  <div class="container col-12 col-md-8 col-lg-6 text-center">
    
    <div class="srs-window d-flex flex-column justify-content-center align-items-center w-100">
      
      <div v-if="!isReviewing" class="card p-5 bg-light border-0 shadow-sm rounded-4 w-100">
        <h2 class="mb-3">Flashcard Review</h2>
        
        <p class="fs-5 mb-2">
          You have <strong class="text-primary">{{ dueCardsTotal }}</strong> cards ready for review.
        </p>

        <p v-if="dueCardsTotal === 0 && formattedNextReview" class="text-muted mb-4">
          Next recommended review:<br>
          <strong>{{ formattedNextReview }}</strong>
        </p>
        <div v-else class="mb-4"></div>
        
        <div>
          <button 
            class="btn btn-success btn-lg px-5 rounded-pill shadow-sm" 
            @click="startReview" 
          >
            {{ dueCardsTotal > 0 ? 'Start Review' : 'Review Anyways' }}
          </button>
        </div>
      </div>

      <div v-else class="w-100">
        <div class="mb-3 fw-bold text-secondary fs-6 d-flex justify-content-between align-items-center">
          <span>Reviewing</span>
          <span>{{ currentCardIndex + 1 }} / {{ reviewQueue.length }}</span>
        </div>
        <div class="progress mb-4" style="height: 8px;">
          <div 
            class="progress-bar bg-primary" 
            role="progressbar" 
            :style="{ width: progressPercentage + '%' }" 
            :aria-valuenow="progressPercentage" 
            aria-valuemin="0" 
            aria-valuemax="100"
          ></div>
        </div>

        <div 
          class="flashcard w-100 mb-4" 
          :class="{ flipped: isFlipped }" 
          @click="flipCard"
        >
          <div class="card-inner">
            <div class="card-front bg-white border border-2 border-primary rounded-4 shadow-sm d-flex flex-column justify-content-center align-items-center p-4">
              <h3 class="mb-0">{{ currentCard.front }}</h3>
              <p v-show="!hasFlipped" class="text-muted small mt-3 mb-0">
                (Click or press <kbd>Space</kbd> to flip)
              </p>
            </div>
            
            <div class="card-back bg-primary bg-opacity-50 border border-2 border-primary rounded-4 shadow d-flex flex-column justify-content-center align-items-center p-4">
              <h3 class="mb-0">{{ currentCard.back }}</h3>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-between gap-3" :class="{ 'invisible': !hasFlipped }">
          <button class="btn btn-success flex-fill w-100 py-3 fw-bold rounded-3 shadow-sm" @click="handleRating('easy')">
            <span class="d-block text-uppercase mb-1">Easy</span>
            <kbd class="bg-dark bg-opacity-25 text-light border-0">E</kbd>
          </button>
          <button class="btn btn-primary flex-fill w-100 py-3 fw-bold rounded-3 shadow-sm" @click="handleRating('kinda')">
            <span class="d-block text-uppercase mb-1">Kinda</span>
            <kbd class="bg-dark bg-opacity-25 text-light border-0">K</kbd>
          </button>
          <button class="btn btn-danger flex-fill w-100 py-3 fw-bold rounded-3 shadow-sm" @click="handleRating('forgot')">
            <span class="d-block text-uppercase mb-1">Forgot</span>
            <kbd class="bg-dark bg-opacity-25 text-light border-0">F</kbd>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Reserves the exact vertical space needed for the full review screen. 
  40px (Progress) + 32px (Bar) + 324px (Card) + ~100px (Buttons & Gaps) = ~520px
*/
.srs-window {
  min-height: 520px;
}

.flashcard {
  height: 300px;
  perspective: 1000px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}

.flashcard.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
  padding: 0.2rem 0.4rem;
  border-radius: 0.2rem;
}

.progress-bar {
  transition: width 0.4s ease;
}
</style>
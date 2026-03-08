<script setup>
// TODO: preserve correct order of creation for cards that are uploaded in batches
// TODO: allow URL images somehow or maybe uploads?
// TODO: firework or party popper animation when finished
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import SimpleBar from 'simplebar-vue';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CARDS_PER_SESSION = 25;

const props = defineProps({
  cards: { type: Array, default: () => [] },
});

const emit = defineEmits(['rate']);

const isReviewing = ref(false);
const isFlipped = ref(false);
const hasFlipped = ref(false);
const reviewQueue = ref([]);
const currentCardIndex = ref(0);

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return 0;
}

const normalizedCards = computed(() => {
  return (props.cards || []).map((c) => ({
    id: c.id,
    front: String(c.front || ''),
    back: String(c.back || ''),
    interval: Number(c.interval || 0),
    ease: Number(c.ease || 2.5),
    streak: Number(c.streak || 0),
    dueDateMs: toMillis(c.dueDate) || Date.now(),
  }));
});

const cardsDue = computed(() => {
  const now = Date.now();
  return normalizedCards.value
    .filter((card) => card.dueDateMs <= now)
    .sort((a, b) => a.dueDateMs - b.dueDateMs);
});

const dueCardsTotal = computed(() => cardsDue.value.length);
const currentCard = computed(() => reviewQueue.value[currentCardIndex.value]);

const progressPercentage = computed(() => {
  if (reviewQueue.value.length === 0) return 0;
  return ((currentCardIndex.value + 1) / reviewQueue.value.length) * 100;
});

const formattedNextReview = computed(() => {
  const futureCards = normalizedCards.value.filter((card) => card.dueDateMs > Date.now());
  if (futureCards.length === 0) return null;

  futureCards.sort((a, b) => a.dueDateMs - b.dueDateMs);
  const nextDate = new Date(futureCards[0].dueDateMs);

  const datePart = nextDate.toLocaleDateString();
  const timePart = nextDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return `${datePart} at ${timePart}`;
});

// New Computed Properties for the UI states
const statusText = computed(() => {
  if (isReviewing.value) return 'Reviewing';
  return dueCardsTotal.value > 0 ? 'Ready to review' : 'Nothing for review';
});

const canRate = computed(() => isReviewing.value && hasFlipped.value);

const resetReviewState = () => {
  isReviewing.value = false;
  isFlipped.value = false;
  hasFlipped.value = false;
  reviewQueue.value = [];
  currentCardIndex.value = 0;
};

watch(
  () => props.cards,
  () => {
    // If cards change while reviewing, keep the current session stable.
    // If not reviewing, UI will reflect new due count immediately.
  }
);

const startReview = () => {
  if (normalizedCards.value.length === 0) return;

  if (dueCardsTotal.value > 0) {
    reviewQueue.value = cardsDue.value.slice(0, MAX_CARDS_PER_SESSION);
  } else {
    const upcomingCards = [...normalizedCards.value].sort((a, b) => a.dueDateMs - b.dueDateMs);
    reviewQueue.value = upcomingCards.slice(0, MAX_CARDS_PER_SESSION);
  }

  currentCardIndex.value = 0;
  isFlipped.value = false;
  hasFlipped.value = false;
  isReviewing.value = true;
};

const flipCard = () => {
  if (!isReviewing.value) return;
  isFlipped.value = !isFlipped.value;
  hasFlipped.value = true;
};

const nextCard = () => {
  isFlipped.value = false;
  hasFlipped.value = false;

  if (currentCardIndex.value < reviewQueue.value.length - 1) {
    currentCardIndex.value++;
  } else {
    resetReviewState();
  }
};

const handleRating = (rating) => {
  if (!canRate.value) return;
  
  const card = currentCard.value;
  if (!card) return;

  let interval = card.interval;
  let ease = card.ease;
  let streak = card.streak;

  if (rating === 'forgot') {
    streak = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (rating === 'kinda') {
    if (streak === 0) interval = 1;
    else if (streak === 1) interval = 3;
    else interval = Math.ceil(interval * ease);
    streak += 1;
  } else if (rating === 'easy') {
    if (streak === 0) interval = 4;
    else interval = Math.ceil(interval * ease * 1.3);
    streak += 1;
    ease += 0.15;
  }

  const dueDateMs = Date.now() + interval * ONE_DAY_MS;

  emit('rate', {
    cardId: card.id,
    patch: { interval, ease, streak, dueDateMs },
  });

  nextCard();
};

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
</script>

<template>
  <div class="col-12 text-center max-950">
    <div class="srs-window d-flex flex-column justify-content-center align-items-center w-100">
      
      <div class="w-100 mb-3 fw-bold text-secondary fs-6 d-flex justify-content-between align-items-center">
        <span>{{ statusText }}</span>
        <span>{{ isReviewing ? currentCardIndex + 1 : 0 }} / {{ isReviewing ? reviewQueue.length : 0 }}</span>
      </div>
      
      <div class="progress mb-4 w-100" style="height: 8px">
        <div
          class="progress-bar bg-primary"
          role="progressbar"
          :style="{ width: (isReviewing ? progressPercentage : 0) + '%' }"
          :aria-valuenow="isReviewing ? progressPercentage : 0"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>

      <div class="flashcard w-100 mb-4" :class="{ flipped: isFlipped && isReviewing }" @click="flipCard">
        <div class="card-inner">

          <div
            class="card-front bg-white border border-2 border-primary rounded-4 shadow-sm overflow-hidden"
          >
            <div 
              v-if="!isReviewing" 
              class="h-100 w-100 d-flex flex-column justify-content-center align-items-center p-4"
            >
              <h3 class="mb-3">Flashcard Review</h3>
              <p class="fs-6 mb-3">
                You have <strong class="text-primary">{{ dueCardsTotal }}</strong> cards ready.
              </p>
              <button
                class="btn btn-success btn-lg px-4 rounded-pill shadow-sm"
                :disabled="normalizedCards.length === 0"
                @click.stop="startReview"
              >
                {{ dueCardsTotal > 0 ? 'Start Review' : 'Review Anyways' }}
              </button>
              <p v-if="dueCardsTotal === 0 && formattedNextReview" class="text-muted small mt-3 mb-0">
                Next review: {{ formattedNextReview }}
              </p>
            </div>
            
            <div v-show="isReviewing" class="h-100 w-100 p-2">
              <SimpleBar class="h-100 w-100 text-center">
                <h3 class="card-text mb-0 p-3">{{ currentCard?.front }}</h3>
              </SimpleBar>
            </div>
          </div>

          <div
            class="card-back bg-primary bg-opacity-10 border border-2 border-primary rounded-4 shadow-sm overflow-hidden"
          >
            <div class="h-100 w-100 p-2">
              <SimpleBar class="h-100 w-100 text-center">
                <h3 class="card-text mb-0 p-3">{{ currentCard?.back }}</h3>
              </SimpleBar>
            </div>
          </div>

        </div>
      </div>

      <div class="d-flex justify-content-between gap-3 w-100">
        <button 
          class="btn flex-fill w-100 py-3 fw-bold rounded-3 shadow-sm" 
          :class="canRate ? 'btn-success' : 'btn-outline-success'"
          :disabled="!canRate"
          @click="handleRating('easy')"
        >
          <span class="d-block text-uppercase mb-1">Easy</span>
          <kbd class="bg-dark bg-opacity-25 text-light border-0">E</kbd>
        </button>
        <button 
          class="btn flex-fill w-100 py-3 fw-bold rounded-3 shadow-sm" 
          :class="canRate ? 'btn-primary' : 'btn-outline-primary'"
          :disabled="!canRate"
          @click="handleRating('kinda')"
        >
          <span class="d-block text-uppercase mb-1">Kinda</span>
          <kbd class="bg-dark bg-opacity-25 text-light border-0">K</kbd>
        </button>
        <button 
          class="btn flex-fill w-100 py-3 fw-bold rounded-3 shadow-sm" 
          :class="canRate ? 'btn-danger' : 'btn-outline-danger'"
          :disabled="!canRate"
          @click="handleRating('forgot')"
        >
          <span class="d-block text-uppercase mb-1">Forgot</span>
          <kbd class="bg-dark bg-opacity-25 text-light border-0">F</kbd>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.max-950 {
  max-width: 950px;
}

.srs-window {
  min-height: 480px;
}

.flashcard {
  height: 300px;
  perspective: 1000px;
  cursor: pointer;
  container-type: size; 
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

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

.card-text {
  font-size: clamp(1rem, 10cqh, 1.75rem);
  width: 100%;
  word-wrap: break-word;
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

:deep(.simplebar-content) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}
</style>


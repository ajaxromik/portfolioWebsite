<script setup>
import { ref } from 'vue';
import FlashcardReview from './FlashcardReview.vue';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const deck = ref(
  Array.from({ length: 30 }, (_, i) => ({
    id: String(i + 1),
    front: `Mock Question ${i + 1}`,
    back: `Mock Answer ${i + 1}`,
    interval: 0,
    ease: 2.5,
    streak: 0,
    dueDate: Date.now() - ONE_DAY_MS,
  }))
);

const handleRate = ({ cardId, patch }) => {
  const idx = deck.value.findIndex((c) => c.id === cardId);
  if (idx === -1) return;
  deck.value[idx] = {
    ...deck.value[idx],
    interval: patch.interval,
    ease: patch.ease,
    streak: patch.streak,
    dueDate: patch.dueDateMs,
  };
};
</script>

<template>
  <FlashcardReview :cards="deck" @rate="handleRate" />
</template>
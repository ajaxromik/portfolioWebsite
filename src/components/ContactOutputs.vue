<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; 

// SOURCE OF TRUTH: Must match the write component exactly
const ALLOWED_ASPECTS = ['Projects', 'Certifications', 'Jobs'];
const ALLOWED_AREAS = [
  'Cybersecurity', 
  'OOP', 
  'Database Design', 
  'Full-Stack', 
  'Another Language/Technology'
];

const validEntries = ref([]);
const isLoading = ref(true);
let unsubscribe = null; 

onMounted(() => {
  const adviceRef = collection(db, 'career_advice');
  const q = query(adviceRef, orderBy('createdAt', 'desc'));

  unsubscribe = onSnapshot(q, (querySnapshot) => {
    const fetchedEntries = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // STRICT READ VALIDATION: 
      // Only push to the array if BOTH values exactly match our allowed lists.
      // Anything else is ignored entirely.
      const isAspectValid = ALLOWED_ASPECTS.includes(data.aspect);
      const isAreaValid = ALLOWED_AREAS.includes(data.area);

      if (isAspectValid && isAreaValid) {
        fetchedEntries.push({
          id: doc.id,
          aspect: data.aspect,
          area: data.area,
          createdAt: data.createdAt
        });
      } else {
        console.warn(`Invalid data dropped silently: Document ID ${doc.id}`);
      }
    });
    
    validEntries.value = fetchedEntries;
    isLoading.value = false;
  }, (error) => {
    console.error("Error fetching entries: ", error);
    isLoading.value = false;
  });
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

const formatDate = (timestamp) => {
  if (!timestamp) return 'Just now'; 
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric'
  }).format(date);
};
</script>

<template>
  <div class="advice-entries">
    <h3 class="mb-3">Community Recommendations</h3>

    <div v-if="isLoading" class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>

    <div v-else-if="validEntries.length === 0" class="alert alert-info">
      No recommendations yet. Cast your vote above!
    </div>

    <div v-else class="d-flex flex-column gap-2">
      <div v-for="entry in validEntries" :key="entry.id" class="card shadow-sm border-start border-primary border-4">
        <div class="card-body py-2">
          <p class="mb-0">
            Someone suggested I focus on 
            <span class="fw-bold text-primary">{{ entry.aspect }}</span> 
            in 
            <span class="badge bg-secondary rounded-pill">{{ entry.area }}</span>
          </p>
          <small class="text-muted" style="font-size: 0.75rem;">
            {{ formatDate(entry.createdAt) }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>
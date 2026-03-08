<script setup>
import { Timestamp } from 'firebase/firestore';
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';
import FlashcardReview from '../components/FlashcardReview.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import { useAuth } from '../composables/useAuth';
import {
  MAX_CARDS_PER_DECK,
  MAX_CARD_TEXT_LENGTH,
  bulkCreateCards,
  bulkUpdateCards,
  deleteCard,
  getDeck,
  listenCards,
  updateCard,
} from '../services/userDBUpdate';
import { Modal } from 'bootstrap'

const route = useRoute();
const { user } = useAuth();

const deckId = computed(() => String(route.params.deckId || ''));

const deck = ref(null);
const cards = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

const pendingCreates = ref([]);
const isFlushingCreates = ref(false);

const pendingSrs = ref(new Map()); // cardId -> patch (interval/ease/streak/dueDateMs)
const isFlushingSrs = ref(false);

const newFront = ref('');
const newBack = ref('');
const createError = ref('');

const editingCard = ref(null);
const editFront = ref('');
const editBack = ref('');
const editError = ref('');
const isSavingEdit = ref(false);
const deleteBusyId = ref('');

let stopCards = null;
let createFlushTimer = null;
let srsFlushTimer = null;

const totalCardsCount = computed(() => cards.value.length + pendingCreates.value.length);
const canAddMoreCards = computed(() => totalCardsCount.value < MAX_CARDS_PER_DECK);

const cardsForReview = computed(() => {
  const overrides = pendingSrs.value;
  return cards.value.map((c) => {
    const p = overrides.get(c.id);
    if (!p) return c;
    return {
      ...c,
      interval: p.interval,
      ease: p.ease,
      streak: p.streak,
      dueDate: Timestamp.fromMillis(p.dueDateMs),
    };
  });
});

const hasAnyCards = computed(() => cards.value.length > 0);

const frontRemaining = computed(() => MAX_CARD_TEXT_LENGTH - newFront.value.length);
const backRemaining = computed(() => MAX_CARD_TEXT_LENGTH - newBack.value.length);

const flushCreates = async () => {
  if (isFlushingCreates.value) return;
  if (!user.value?.uid) return;
  if (!deckId.value) return;
  if (pendingCreates.value.length === 0) return;

  isFlushingCreates.value = true;
  createError.value = '';
  const batch = pendingCreates.value.slice();

  try {
    await bulkCreateCards(user.value.uid, deckId.value, batch);
    pendingCreates.value = pendingCreates.value.slice(batch.length);
  } catch (e) {
    console.error(e);
    createError.value =
      e?.message === 'CARD_LIMIT'
        ? 'Card limit reached (75).'
        : 'Failed to save new cards. Your draft cards are still on this page.';
  } finally {
    isFlushingCreates.value = false;
  }
};

const flushSrs = async () => {
  if (isFlushingSrs.value) return;
  if (!user.value?.uid) return;
  if (!deckId.value) return;
  if (pendingSrs.value.size === 0) return;

  isFlushingSrs.value = true;
  const entries = Array.from(pendingSrs.value.entries());
  pendingSrs.value = new Map();

  try {
    await bulkUpdateCards(
      user.value.uid,
      deckId.value,
      entries.map(([cardId, patch]) => ({
        cardId,
        patch: {
          interval: patch.interval,
          ease: patch.ease,
          streak: patch.streak,
          dueDate: Timestamp.fromMillis(patch.dueDateMs),
        },
      }))
    );
  } catch (e) {
    console.error(e);
    // If it fails, merge back for next attempt.
    const merged = new Map(pendingSrs.value);
    for (const [cardId, patch] of entries) merged.set(cardId, patch);
    pendingSrs.value = merged;
  } finally {
    isFlushingSrs.value = false;
  }
};

const enqueueCreate = () => {
  createError.value = '';
  const front = newFront.value.trim();
  const back = newBack.value.trim();

  if (!front || !back) return;
  if (!canAddMoreCards.value) {
    createError.value = 'Card limit reached (75).';
    return;
  }

  pendingCreates.value.push({ front: front.slice(0, MAX_CARD_TEXT_LENGTH), back: back.slice(0, MAX_CARD_TEXT_LENGTH) });
  newFront.value = '';
  newBack.value = '';
};

const onCreateKeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    enqueueCreate();
  }
};

const handleRate = ({ cardId, patch }) => {
  if (!cardId) return;
  const next = new Map(pendingSrs.value);
  next.set(cardId, patch);
  pendingSrs.value = next;
};

const openEdit = async (card) => {
  editError.value = '';
  editingCard.value = card;
  editFront.value = card.front || '';
  editBack.value = card.back || '';

  const modalEl = document.getElementById('editCardModal');
  const instance = Modal.getOrCreateInstance(modalEl);
  instance.show();
};

const saveEdit = async () => {
  if (!user.value?.uid) return;
  if (!deckId.value) return;
  if (!editingCard.value?.id) return;

  const front = editFront.value.trim();
  const back = editBack.value.trim();
  if (!front || !back) {
    editError.value = 'Front and back are required.';
    return;
  }

  isSavingEdit.value = true;
  editError.value = '';
  try {
    await updateCard(user.value.uid, deckId.value, editingCard.value.id, {
      front: front.slice(0, MAX_CARD_TEXT_LENGTH),
      back: back.slice(0, MAX_CARD_TEXT_LENGTH),
    });
    const modalEl = document.getElementById('editCardModal');
    Modal.getOrCreateInstance(modalEl).hide();
    editingCard.value = null;
  } catch (e) {
    console.error(e);
    editError.value = 'Save failed. Please try again.';
  } finally {
    isSavingEdit.value = false;
  }
};

const deleteModalRef = ref(null);
const cardToDelete = ref(null);
const isDeletingCard = ref(false);

const promptDeleteCard = (card) => {
  cardToDelete.value = card;
  deleteModalRef.value?.show();
};

const confirmDeleteCard = async () => {
  if (!user.value?.uid) return;
  if (!deckId.value) return;
  if (!cardToDelete.value) return;

  isDeletingCard.value = true;
  
  try {
    await deleteCard(user.value.uid, deckId.value, cardToDelete.value.id);
    deleteModalRef.value?.hide();
    cardToDelete.value = null;
  } catch (e) {
    console.error(e);
  } finally {
    isDeletingCard.value = false;
  }
};

const loadDeckOnce = async () => {
  if (!user.value?.uid) return;
  if (!deckId.value) return;
  deck.value = await getDeck(user.value.uid, deckId.value);
};

onMounted(async () => {
  try {
    await loadDeckOnce();
  } catch (e) {
    console.error(e);
  }

  if (user.value?.uid && deckId.value) {
    stopCards = listenCards(
      user.value.uid,
      deckId.value,
      (nextCards) => {
        cards.value = nextCards;
        isLoading.value = false;
      },
      (err) => {
        console.error(err);
        errorMessage.value = 'Failed to load cards.';
        isLoading.value = false;
      }
    );
  }

  createFlushTimer = window.setInterval(flushCreates, 30_000);
  srsFlushTimer = window.setInterval(flushSrs, 30_000);
});

const flushAll = async () => {
  await flushCreates();
  await flushSrs();
};

onBeforeRouteLeave(async () => {
  await flushAll();
});

onBeforeUnmount(async () => {
  // Clean up Bootstrap modal instance
  const modalEl = document.getElementById('editCardModal');
  if (modalEl) {
    const instance = Modal.getInstance(modalEl);
    if (instance) {
      instance.dispose();
    }
  }
  // Forcibly clear leftover Bootstrap classes/elements if user navigated during modal animations
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());

  if (stopCards) stopCards();
  if (createFlushTimer) window.clearInterval(createFlushTimer);
  if (srsFlushTimer) window.clearInterval(srsFlushTimer);
  await flushAll();
});
</script>

<template>
  <div class="bg-new-light text-new-dark flex-grow-1 d-flex flex-column">
    
    <div class="bg-light w-100 border-bottom">
      <div class="container-fluid py-3">
        <div class="row align-items-start justify-content-between m-0">
          
          <div class="col-auto col-lg-2 order-1 mb-3 mb-lg-0 px-0">
            <router-link to="/flashcards/decks" class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-arrow-left me-1"></i>&nbsp;Back
            </router-link>
          </div>

          <div class="col-auto col-lg-2 order-2 order-lg-3 text-end mb-3 mb-lg-0 px-0">
            <div class="small text-muted">Deck</div>
            <div class="fw-semibold">{{ deck?.title || '...' }}</div>
          </div>

          <div class="col-12 col-lg-8 order-3 order-lg-2 d-flex flex-column align-items-center px-0">
            
            <div v-if="isLoading" class="d-flex align-items-center gap-3 my-4">
              <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
              <div class="text-secondary">Loading cards...</div>
            </div>

            <div v-else-if="errorMessage" class="alert alert-danger w-100 my-4">{{ errorMessage }}</div>

            <div v-else-if="hasAnyCards" class="w-100 d-flex flex-column align-items-center">
              <FlashcardReview :cards="cardsForReview" @rate="handleRate" />
              <div class="text-center text-muted small mt-2">
                Click the card or press <kbd>Space</kbd> to flip. Resyncs every 30 seconds. 
                <span v-if="isFlushingSrs" class="ms-2">
                  <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Saving...
                </span>
              </div>
            </div>

            <div v-else class="text-center py-4 w-100">
              <div class="card border-0 shadow-sm p-4 p-md-5 mx-auto" style="max-width: 500px;">
                <h2 class="h4 fw-bold mb-2">No cards yet</h2>
                <p class="text-secondary mb-0">Add cards below to start reviewing.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <section class="py-4 py-md-5 bg-new-light">
      <div class="container">
        <div class="d-flex justify-content-between align-items-end flex-wrap gap-3 mb-3">
          <div>
            <h2 class="h4 fw-bold mb-1">Manage Cards</h2>
            <div class="text-muted small">
              {{ totalCardsCount }} / {{ MAX_CARDS_PER_DECK }} cards
              <span v-if="pendingCreates.length" class="ms-2 badge bg-secondary rounded-pill">
                {{ pendingCreates.length }} pending save
              </span>
            </div>
          </div>
          <button class="btn btn-outline-primary" type="button" :disabled="!pendingCreates.length || isFlushingCreates" @click="flushCreates">
            <span v-if="isFlushingCreates" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Save now
          </button>
        </div>

        <div v-if="createError" class="alert alert-danger">{{ createError }}</div>
        <div v-if="!canAddMoreCards" class="alert alert-warning">
          Card limit reached (75). Delete a card to add another.
        </div>

        <div class="row g-4">
          <div class="col-12 col-lg-5 order-1 order-lg-2">
            <div class="card shadow-sm border-0">
              <div class="card-body">
                <h3 class="h5 fw-bold mb-3">Quick add</h3>

                <div class="mb-3">
                  <label class="form-label">Front</label>
                  <textarea
                    v-model="newFront"
                    class="form-control"
                    rows="3"
                    :maxlength="MAX_CARD_TEXT_LENGTH"
                    :disabled="!canAddMoreCards"
                    @keydown="onCreateKeydown"
                  ></textarea>
                  <div class="text-muted small mt-1">{{ frontRemaining }} characters left</div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Back</label>
                  <textarea
                    v-model="newBack"
                    class="form-control"
                    rows="3"
                    :maxlength="MAX_CARD_TEXT_LENGTH"
                    :disabled="!canAddMoreCards"
                    @keydown="onCreateKeydown"
                  ></textarea>
                  <div class="text-muted small mt-1">{{ backRemaining }} characters left</div>
                </div>

                <button class="btn btn-success w-100" type="button" :disabled="!canAddMoreCards" @click="enqueueCreate">
                  Add card (Enter)
                </button>

                <div class="text-muted small mt-3">
                  Tip: Use <kbd>Tab</kbd> and <kbd>Shift</kbd> + <kbd>Tab</kbd> to move forward and backwards between inputs.
                  Use <kbd>Enter</kbd> to submit a card.
                  <br />
                  Cards are saved in batches every 30 seconds.
                  <!-- TODO: reword -->
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-7 order-2 order-lg-1">
            <div class="card shadow-sm border-0">
              <div class="card-body">
                <div v-if="cards.length === 0" class="alert alert-info mb-0">
                  No saved cards yet.
                </div>

                <div v-else class="list-group">
                  <div v-for="card in cards" :key="card.id" class="list-group-item d-flex justify-content-between align-items-start gap-3">
                    <div class="flex-grow-1">
                      <div class="fw-semibold">{{ card.front }}</div>
                      <div class="text-muted small">{{ card.back }}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-outline-secondary btn-sm" type="button" @click="openEdit(card)">
                        Edit
                      </button>
                      <button class="btn btn-outline-danger btn-sm" type="button" :disabled="deleteBusyId === card.id" @click="promptDeleteCard(card)">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="pendingCreates.length" class="mt-3 text-muted small">
                  Pending cards (not saved yet): {{ pendingCreates.length }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div id="editCardModal" class="modal fade" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0">
            <div class="modal-header">
              <h2 class="h5 modal-title mb-0">Edit card</h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" :disabled="isSavingEdit"></button>
            </div>
            <form @submit.prevent="saveEdit">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Front</label>
                  <textarea v-model="editFront" class="form-control" rows="3" :maxlength="MAX_CARD_TEXT_LENGTH" :disabled="isSavingEdit"></textarea>
                </div>
                <div class="mb-2">
                  <label class="form-label">Back</label>
                  <textarea v-model="editBack" class="form-control" rows="3" :maxlength="MAX_CARD_TEXT_LENGTH" :disabled="isSavingEdit"></textarea>
                </div>
                <div v-if="editError" class="alert alert-danger mt-3 mb-0" role="alert">{{ editError }}</div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" :disabled="isSavingEdit">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="isSavingEdit">
                  <span v-if="isSavingEdit" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
    <ConfirmModal
      ref="deleteModalRef"
      title="Delete Card"
      confirmText="Delete Card"
      :isProcessing="isDeletingCard"
      @confirm="confirmDeleteCard"
    >
      Are you sure you want to delete this card?
      <div class="mt-3 p-3 bg-white rounded border">
        <strong>Front:</strong> {{ cardToDelete?.front }}
      </div>
    </ConfirmModal>
  </div>
</template>


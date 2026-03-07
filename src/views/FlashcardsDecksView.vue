<script setup>
import { computed, onMounted, onBeforeUnmount, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { MAX_DECKS_PER_USER, createDeck, deleteDeck, listenDecks, listenUserProfile, renameDeck } from '../services/userDBUpdate';
import { Modal, Dropdown } from 'bootstrap'
import ConfirmModal from '../components/ConfirmModal.vue';

const router = useRouter();
const { user, loading, logout } = useAuth();

const handleLogout = async () => {
  try {
    await logout();
    router.push('/flashcards');
  } catch (error) {
    console.error('Failed to log out:', error);
  }
};

const decks = ref([]);
const userProfile = ref(null);
const isLoadingDecks = ref(true);
const loadError = ref('');

const isSavingDeck = ref(false);

const deleteModalRef = ref(null);
const deckToDelete = ref(null);
const isDeleting = ref(false);

const modalEl = ref(null);
let modalInstance = null;
let activeDropdownInstance = null;

const mode = ref('create'); // 'create' | 'edit'
const editingDeckId = ref('');
const deckTitle = ref('');
const deckDescription = ref('');
const formError = ref('');

let stopDecks = null;
let stopUser = null;

const deckCount = computed(() => Number(userProfile.value?.deckCount ?? decks.value.length ?? 0));
const canCreateDeck = computed(() => deckCount.value < MAX_DECKS_PER_USER);

const openModal = async ({ editDeck } = {}) => {
  formError.value = '';
  if (editDeck) {
    mode.value = 'edit';
    editingDeckId.value = editDeck.id;
    deckTitle.value = editDeck.title || '';
    deckDescription.value = editDeck.description || '';
  } else {
    mode.value = 'create';
    editingDeckId.value = '';
    deckTitle.value = '';
    deckDescription.value = '';
  }

  if (!modalInstance) {
    modalInstance = new Modal(modalEl.value);
  }

  modalInstance.show();
  activeDropdownInstance?.hide();
  activeDropdownInstance = null;
};

const closeModal = () => modalInstance?.hide();

const submitDeck = async () => {
  formError.value = '';
  const title = deckTitle.value.trim();
  const description = deckDescription.value.trim();
  if (!title) {
    formError.value = 'Deck title is required.';
    return;
  }

  if (!user.value?.uid) return;
  isSavingDeck.value = true;

  try {
    if (mode.value === 'edit') {
      await renameDeck(user.value.uid, editingDeckId.value, { title, description });
    } else {
      if (!canCreateDeck.value) throw new Error('DECK_LIMIT');
      const newId = await createDeck(user.value.uid, { title, description });
      closeModal();
      router.push(`/flashcards/decks/${newId}`);
      return;
    }
    closeModal();
  } catch (e) {
    console.error(e);
    formError.value = e?.message === 'DECK_LIMIT' ? 'Deck limit reached (15). Delete a deck to create another.' : 'Save failed. Please try again.';
  } finally {
    isSavingDeck.value = false;
  }
};

const promptDeleteDeck = (deck) => {
  deckToDelete.value = deck;
  deleteModalRef.value?.show();
};

const confirmDeleteDeck = async () => {
  if (!deckToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    await deleteDeck(user.value.uid, deckToDelete.value.id);
    deleteModalRef.value?.hide();
    deckToDelete.value = null;
  } catch (error) {
    console.error("Error deleting deck:", error);
  } finally {
    isDeleting.value = false;
  }
};

const goToDeck = (deckId) => router.push(`/flashcards/decks/${deckId}`);

// can't use data-bs-toggle="dropdown" because dynamic load
const toggleDropdown = (event) => {
  const buttonEl = event.currentTarget;
  const dropdown = Dropdown.getOrCreateInstance(buttonEl);
  if(activeDropdownInstance !== dropdown) {
    activeDropdownInstance?.hide();
    activeDropdownInstance = dropdown;
  } else {
    activeDropdownInstance = null;
  }
  dropdown.toggle();
};

onMounted(() => {
  watch(
    () => user.value?.uid,
    (uid) => {
      loadError.value = '';
      decks.value = [];
      userProfile.value = null;
      isLoadingDecks.value = true;

      if (stopDecks) stopDecks();
      if (stopUser) stopUser();

      if (!uid) return;

      stopUser = listenUserProfile(
        uid,
        (profile) => {
          userProfile.value = profile;
        },
        (err) => {
          console.error(err);
        }
      );

      stopDecks = listenDecks(
        uid,
        (nextDecks) => {
          decks.value = nextDecks;
          isLoadingDecks.value = false;
        },
        (err) => {
          console.error(err);
          loadError.value = 'Failed to load decks.';
          isLoadingDecks.value = false;
        }
      );
    },
    { immediate: true }
  );
});

onBeforeUnmount(() => {
  // Clean up Bootstrap modal instance
  modalInstance?.dispose();

  // Forcibly clear leftover Bootstrap classes/elements if user navigated during modal animations
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
});

onUnmounted(() => {
  if (stopDecks) stopDecks();
  if (stopUser) stopUser();
});
</script>

<template>
  <div class="bg-new-light text-new-dark flex-grow-1 d-flex flex-column">
    <section class="py-5 bg-light">
      <div class="container">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h1 class="h2 fw-bold mb-1">My decks</h1>
            <p class="text-secondary mb-0">
              <span v-if="loading">Loading session...</span>
              <span v-else class="text-muted">Session loaded</span>
            </p>
            <div class="text-muted small mt-1">
              {{ deckCount }} / {{ MAX_DECKS_PER_USER }} decks
              <!-- TODO: make this show "15 decks max" until you're at 12 decks -->
            </div>
          </div>
          <div class="d-flex gap-2">
            <router-link to="/flashcards" class="btn btn-outline-secondary"><i class="bi bi-arrow-left-short"></i> Back to landing</router-link>
            <button type="button" class="btn btn-outline-danger" @click="handleLogout" :disabled="loading">
              <i class="bi bi-box-arrow-right"></i> Logout
            </button>
            <button type="button" class="btn btn-primary" :disabled="loading || !canCreateDeck" @click="openModal()">
              + New deck
            </button>
          </div>
        </div>

        <div v-if="!canCreateDeck" class="alert alert-warning">
          You've reached the deck limit (15). Delete a deck to create another.
        </div>

        <div v-if="isLoadingDecks" class="d-flex align-items-center gap-3">
          <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
          <div class="text-secondary">Loading decks...</div>
        </div>

        <div v-else-if="loadError" class="alert alert-danger">{{ loadError }}</div>

        <div v-else-if="decks.length === 0" class="alert alert-info">
          No decks yet. Create your first deck to start adding cards.
        </div>

        <div v-else class="row g-3">
          <div v-for="deck in decks" :key="deck.id" class="col-12 col-md-6 col-lg-4">
            <div class="card shadow-sm h-100 border-0">
              <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start gap-2">
                  <button
                    class="btn btn-link text-start p-0 text-decoration-none flex-grow-1"
                    type="button"
                    @click="goToDeck(deck.id)"
                  >
                    <h2 class="h5 fw-bold mb-1 text-new-dark">{{ deck.title }}</h2>
                  </button>

                  <div class="dropdown">
                    <button
                      class="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                      type="button"
                      @click.stop="toggleDropdown"
                      aria-expanded="false"
                      :disabled="deckToDelete?.id === deck.id"
                      title="Deck actions"
                    >
                      <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                      <li>
                        <button class="dropdown-item" type="button" @click="openModal({ editDeck: deck })">
                          Rename / edit
                        </button>
                      </li>
                      <li><hr class="dropdown-divider" /></li>
                      <li>
                        <button class="dropdown-item text-danger" type="button" @click="promptDeleteDeck(deck)">
                          <span v-if="deckToDelete?.id === deck.id" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <p v-if="deck.description" class="text-secondary mt-2 mb-3 flex-grow-1">
                  {{ deck.description }}
                </p>
                <p v-else class="text-secondary mt-2 mb-3 flex-grow-1">
                  <span class="fst-italic">No description</span>
                </p>

                <div class="d-flex justify-content-between align-items-center text-muted small">
                  <span>{{ Number(deck.cardCount || 0) }} cards</span>
                  <button class="btn btn-outline-primary btn-sm" type="button" @click="goToDeck(deck.id)">
                    Open
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div ref="modalEl" class="modal fade" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0">
            <div class="modal-header">
              <h2 class="h5 modal-title mb-0">{{ mode === 'edit' ? 'Edit deck' : 'New deck' }}</h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" :disabled="isSavingDeck"></button>
            </div>
            <form @submit.prevent="submitDeck">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Deck title</label>
                  <input
                    v-model="deckTitle"
                    type="text"
                    class="form-control"
                    maxlength="120"
                    required
                    :disabled="isSavingDeck"
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label">Description (optional)</label>
                  <textarea v-model="deckDescription" class="form-control" rows="3" maxlength="500" :disabled="isSavingDeck"></textarea>
                </div>

                <div v-if="formError" class="alert alert-danger mt-3 mb-0" role="alert">
                  {{ formError }}
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" :disabled="isSavingDeck">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="isSavingDeck">
                  <span v-if="isSavingDeck" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ isSavingDeck ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      ref="deleteModalRef"
      title="Delete Deck"
      confirmText="Delete Deck"
      :isProcessing="isDeleting"
      @confirm="confirmDeleteDeck"
    >
      Are you sure you want to delete the deck <strong>{{ deckToDelete?.title || 'this deck' }}</strong>? All cards inside will be permanently lost.
    </ConfirmModal>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Modal } from 'bootstrap';

const props = defineProps({
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  confirmVariant: { type: String, default: 'danger' }, // lets you change button colors (danger, primary, etc.)
  isProcessing: { type: Boolean, default: false }
});

const emit = defineEmits(['confirm']);

// We use a template ref instead of an ID to completely avoid ID collisions
const modalElement = ref(null);
let modalInstance = null;

onMounted(() => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value);
  }
});

onBeforeUnmount(() => {
  if (modalInstance) {
    modalInstance.dispose();
  }
});

// Expose these methods so the parent component can call them
const show = () => modalInstance?.show();
const hide = () => modalInstance?.hide();

defineExpose({ show, hide });
</script>

<template>
  <Teleport to="body">
    <div ref="modalElement" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title" :class="`text-${confirmVariant}`">
              <i v-if="confirmVariant === 'danger'" class="bi bi-exclamation-triangle-fill me-2"></i>
              {{ title }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" :disabled="isProcessing"></button>
          </div>
          
          <div class="modal-body py-4">
            <slot>
              {{ message }}
            </slot>
          </div>
          
          <div class="modal-footer border-top-0 pt-0">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal" :disabled="isProcessing">
              {{ cancelText }}
            </button>
            <button type="button" :class="`btn btn-${confirmVariant}`" @click="emit('confirm')" :disabled="isProcessing">
              <span v-if="isProcessing" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ confirmText }}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import SimpleBar from 'simplebar-vue'
import 'simplebar/dist/simplebar.min.css'

const router = useRouter()
const scrollContainer = ref(null) // SimpleBar component
const scrollPositions = new Map()

router.beforeEach((to, from) => {
  if (scrollContainer.value && scrollContainer.value.scrollElement) {
    scrollPositions.set(from.fullPath, scrollContainer.value.scrollElement.scrollTop)
  }
})

const handleScrollState = () => {
  if (!scrollContainer.value || !scrollContainer.value.scrollElement) return;

  const scrollElement = scrollContainer.value.scrollElement;
  const currentPath = router.currentRoute.value.fullPath;

  const savedTop = scrollPositions.get(currentPath) || 0;
  scrollElement.scrollTo({ top: savedTop, behavior: 'instant' });
};
</script>

<template>
  <SimpleBar class="scrollable-area" ref="scrollContainer">
    <div class="d-flex flex-column min-vh-100">
      <Navbar />

      <main class="flex-grow-1 bg-new-light d-flex flex-column">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in" @after-leave="handleScrollState">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <Footer />
    </div>
  </SimpleBar>
</template>

<style>
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

html {
  overflow-y: auto;
  overflow-x: hidden;
}

.scrollable-area {
  max-height: 100vh;
  overflow-x: hidden;
}
</style>
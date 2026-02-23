<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const scrollToTop = () => {
  window.scrollTo(0, 0);
}
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <Navbar />
    
    <main class="flex-grow-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in" @after-leave="scrollToTop">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <Footer />
  </div>
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
  overflow-y: scroll; /* Keep this to prevent horizontal scrollbar layout shifts */
}
</style>
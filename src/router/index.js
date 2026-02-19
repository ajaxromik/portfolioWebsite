import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WorkView from '../views/WorkView.vue'
import ResumeView from '../views/ResumeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/work', name: 'work', component: WorkView },
    { path: '/resume', name: 'resume', component: ResumeView }
  ],
  // This ensures the page scrolls to the top when navigating to a new route
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
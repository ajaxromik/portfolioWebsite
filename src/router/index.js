import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ExperienceView from '../views/ExperienceView.vue'
import CredentialsView from '../views/CredentialsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/experience', name: 'experience', component: ExperienceView },
    { path: '/credentials', name: 'credentials', component: CredentialsView }
  ],
  linkActiveClass: 'active'
})

export default router
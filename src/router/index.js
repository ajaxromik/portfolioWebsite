import { createRouter, createWebHistory } from 'vue-router'
import PageNotFound from '../views/PageNotFoundView.vue'
import HomeView from '../views/HomeView.vue'
import ExperienceView from '../views/ExperienceView.vue'
import CredentialsView from '../views/CredentialsView.vue'
import FirebaseDB from '../components/FirebaseDB.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/experience',
      name: 'experience',
      component: ExperienceView
    },
    {
      path: '/credentials',
      name: 'credentials',
      component: CredentialsView
    },
    {
      path: '/dbtest',
      name: 'dbtest',
      component: FirebaseDB
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'Page Not Found',
      component: PageNotFound
    }
  ],
  linkActiveClass: 'active'
})

export default router
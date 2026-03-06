import { createRouter, createWebHistory } from 'vue-router'
import PageNotFound from '../views/PageNotFoundView.vue'
import HomeView from '../views/HomeView.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView // Eagerly loaded
    },
    {
      path: '/experience',
      name: 'experience',
      component: () => import('../views/ExperienceView.vue') // lazy load for other components
    },
    {
      path: '/credentials',
      name: 'credentials',
      component: () => import('../views/CredentialsView.vue')
    },
    // {
    //   path: '/dbtest',
    //   name: 'dbtest',
    //   component: () => import('../components/FirebaseDB.vue')
    // },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/AuthView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'Page Not Found',
      component: () => import('../views/PageNotFoundView.vue')
    }
  ],
  linkActiveClass: 'active'
})

export default router
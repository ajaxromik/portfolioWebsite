import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuth } from '../composables/useAuth'


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
      redirect: '/flashcards/login'
    },
    {
      path: '/flashcards',
      name: 'flashcards-landing',
      component: () => import('../views/FlashcardsLandingView.vue')
    },
    {
      path: '/flashcards/login',
      name: 'flashcards-login',
      component: () => import('../views/FlashcardsLoginView.vue')
    },
    {
      path: '/flashcards/decks',
      name: 'flashcards-decks',
      meta: { requiresNonAnonymous: true },
      component: () => import('../views/FlashcardsDecksView.vue')
    },
    {
      path: '/flashcards/decks/:deckId',
      name: 'flashcards-deck-detail',
      meta: { requiresNonAnonymous: true },
      component: () => import('../views/FlashcardsDeckDetailView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'Page Not Found',
      component: () => import('../views/PageNotFoundView.vue')
    }
  ],
  linkActiveClass: 'active'
})

// TODO: learn this part better
router.beforeEach(async (to) => {
  const { user, loading, initAuth } = useAuth()

  // Ensure auth listener is running (App.vue also calls this; composable state is singleton).
  try {
    await initAuth?.()
  } catch (e) {
    console.error('Auth init failed in router guard:', e)
  }

  // If auth is still resolving, let the navigation continue; views will show spinners.
  if (loading.value) return true

  if (to.meta?.requiresNonAnonymous) {
    const currentUser = user.value
    if (!currentUser || currentUser.isAnonymous) {
      return { path: '/flashcards' }
    }
  }

  if (to.path === '/flashcards/login') {
    const currentUser = user.value
    if (currentUser && !currentUser.isAnonymous) {
      return { path: '/flashcards/decks' }
    }
  }

  return true
})

export default router
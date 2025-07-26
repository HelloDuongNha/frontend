import { createRouter, createWebHistory } from 'vue-router'
import { isUserLoggedIn } from './helpers/api'

// Views/Pages
import Home from './views/Home.vue'
import Tags from './views/Tags.vue'
import TagDetail from './views/TagDetail.vue'
import Calendar from './views/Calendar.vue'
import Trash from './views/Trash.vue'
import Auth from './views/Auth.vue'

const routes = [
  {
    path: '/',
    redirect: '/auth'
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth,
    meta: { requiresGuest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: Tags,
    meta: { requiresAuth: true }
  },
  {
    path: '/tags/:id',
    name: 'TagDetail',
    component: TagDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: { requiresAuth: true }
  },
  {
    path: '/trash',
    name: 'Trash',
    component: Trash,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = isUserLoggedIn()
  
  // Routes that require authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      next({ name: 'Auth' })
    } else {
      // User is authenticated, proceed
      next()
    }
  } 
  // Routes that require guest (non-authenticated) access
  else if (to.matched.some(record => record.meta.requiresGuest)) {
    if (isAuthenticated) {
      // User is authenticated, redirect to home
      next({ name: 'Home' })
    } else {
      // User is not authenticated, proceed
      next()
    }
  }
  // Public routes
  else {
    next()
  }
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { isUserLoggedIn } from './helpers/api'

// Views/Pages
import Home from './views/Home.vue'
import Tags from './views/Tags.vue'
import TagDetail from './views/TagDetail.vue'
import Calendar from './views/Calendar.vue'
import Trash from './views/Trash.vue'
import Auth from './views/Auth.vue'
import AllUsers from './views/AllUsers.vue'
import UserDetail from './views/UserDetail.vue'
import UserTagNotes from './views/UserTagNotes.vue'

// Route definitions
const routes = [
  {
    path: '/',
    redirect: '/auth'
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth,
    meta: { requiresGuest: true } // Only accessible to non-authenticated users
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true } // Requires authentication
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
  },
  // Admin routes
  {
    path: '/admin/users',
    name: 'AllUsers',
    component: AllUsers,
    meta: { requiresAuth: true, requiresAdmin: true } // Requires admin privilege
  },
  {
    path: '/admin/users/:id',
    name: 'UserDetail',
    component: UserDetail,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users/:userId/tags/:tagId',
    name: 'UserTagNotes',
    component: UserTagNotes,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

// Create router instance with browser history mode
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards for auth and permission control
router.beforeEach((to, from, next) => {
  const isAuthenticated = isUserLoggedIn()
  const userRole = localStorage.getItem('userRole') || 'user'
  const isAdmin = userRole === 'admin'
  
  // Routes that require authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      next({ name: 'Auth' })
    } 
    // Routes that require admin role
    else if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin) {
      // User is not an admin, redirect to home
      next({ name: 'Home' })
    }
    else {
      // User is authenticated and has proper permissions, proceed
      next()
    }
  } 
  // Routes that require guest (non-authenticated) access
  else if (to.matched.some(record => record.meta.requiresGuest)) {
    if (isAuthenticated) {
      // User is authenticated, redirect based on role
      if (isAdmin) {
        next({ name: 'AllUsers' }) // Admin users go to All Users page
      } else {
        next({ name: 'Home' }) // Regular users go to Home
      }
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

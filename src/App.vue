<template>
  <div class="app-container" :class="{ 'auth-mode': isAuthPage }">
    <!-- Only display Sidebar and AppHeader for authenticated users -->
    <template v-if="isAuthenticated && !isAuthPage">
      <Sidebar @create-note="handleCreateNote" @tag-created="handleTagChange"  />
      <main class="main-content">
        <AppHeader />
        <div class="content-area">
          <router-view @note-created="handleNoteChange" @note-updated="handleNoteChange" @note-deleted="handleNoteChange" @tag-created="handleTagChange" @tag-updated="handleTagChange" @tag-deleted="handleTagChange" />
        </div>
      </main>
    </template>
    
    <!-- For auth pages or unauthenticated users, only show router-view -->
    <router-view v-else />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isUserLoggedIn } from './helpers/api'
import Sidebar from './components/Sidebar.vue'
import AppHeader from './components/AppHeader.vue'

export default {
  name: 'App',
  components: {
    Sidebar,
    AppHeader
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // Authentication state
    const isAuthenticated = ref(isUserLoggedIn())
    
    // Check if current page is Auth page to apply different layout
    const isAuthPage = computed(() => {
      return route.name === 'Auth'
    })
    
    // Update authentication status when route changes
    watch(() => route.path, () => {
      isAuthenticated.value = isUserLoggedIn()
    })
    
    // Navigate to home and trigger note creation form
    const handleCreateNote = () => {
      router.push('/home')
    }
    
    // Handle note creation, update, or deletion events
    const handleNoteChange = () => {
    }
    
    // Handle tag creation, update, or deletion events
    const handleTagChange = () => {
    }
    
    return {
      isAuthenticated,
      isAuthPage,
      handleCreateNote,
      handleNoteChange,
      handleTagChange
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.auth-mode {
  display: block;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

@media screen and (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
}
</style>

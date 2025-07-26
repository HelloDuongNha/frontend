<template>
  <div class="app-container" :class="{ 'auth-mode': isAuthPage }">
    <!-- Only display Sidebar and AppHeader for authenticated users -->
    <template v-if="isAuthenticated && !isAuthPage">
      <Sidebar @create-note="handleCreateNote" @tag-created="handleTagChange" @tag-updated="handleTagChange" />
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
import { ref, computed, onMounted, watch } from 'vue'
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
    
    // Check if user is authenticated
    const isAuthenticated = ref(isUserLoggedIn())
    
    // Check if current page is Auth page
    const isAuthPage = computed(() => {
      return route.name === 'Auth'
    })
    
    // Watch for route changes to update authentication status
    watch(() => route.path, () => {
      isAuthenticated.value = isUserLoggedIn()
    })
    
    // Handle creating a new note
    const handleCreateNote = () => {
      // Navigate to home and emit an event to open the note form
      router.push('/home')
      // You can use a global event bus or state management here to trigger the note form
    }
    
    // Handle changes to notes
    const handleNoteChange = () => {
      // You can implement global state updates or notifications here if needed
    }
    
    // Handle changes to tags
    const handleTagChange = () => {
      // This could trigger a global refresh of tags across components
      // In a real app, you might use Pinia/Vuex for this
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

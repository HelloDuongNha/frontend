<template>
  <div class="user-detail-view">
    <div class="view-header">
      <div class="header-content">
        <button class="btn btn-outline-secondary back-btn" @click="goBack">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <div v-if="user" class="user-info-header">
          <div class="user-avatar">
            <span>{{ getUserInitials(user) }}</span>
          </div>
          <div>
            <h2 class="section-title">{{ user.name }}</h2>
            <p class="user-email">{{ user.email }}</p>
            <span v-if="user.role === 'admin'" class="badge-admin">Admin</span>
            <span v-else-if="user.role === 'user'" class="badge-user">User</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading user data...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchUserAndData" class="btn btn-primary">Try Again</button>
    </div>
    
    <div v-else class="user-content">
      <!-- User Notes Section -->
      <section class="section">
        <div class="section-header">
          <h3 class="subsection-title">Notes</h3>
          <div class="note-count">
            Total: {{ userNotes.length }} note{{ userNotes.length !== 1 ? 's' : '' }}
          </div>
        </div>
        
        <div v-if="userNotes.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No Notes</h3>
          <p>This user doesn't have any notes yet.</p>
        </div>
        
        <div v-else class="notes-grid">
          <NoteCard 
            v-for="note in userNotes" 
            :key="note._id"
            :note="note"
            :allTags="userTags"
            :readOnly="true"
            @click="viewNote(note)"
          />
        </div>
      </section>

      <div class="section-divider"></div>
      
      <!-- User Tags Section -->
      <section class="section">
        <div class="section-header">
          <h3 class="subsection-title">Tags</h3>
          <div class="tag-count">
            Total: {{ userTags.length }} tag{{ userTags.length !== 1 ? 's' : '' }}
          </div>
        </div>
        
        <div v-if="userTags.length === 0" class="empty-state">
          <div class="empty-icon">🏷️</div>
          <h3>No Tags</h3>
          <p>This user doesn't have any tags yet.</p>
        </div>
        
        <div v-else class="tags-grid">
          <div 
            v-for="tag in userTags" 
            :key="tag._id" 
            class="tag-card" 
            @click="navigateToTagNotes(tag)"
          >
            <div class="tag-row">
              <div class="tag-info">
                <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
                <h3 class="tag-name">{{ tag.name }}</h3>
              </div>
            </div>
            <div class="tag-count">
              <span v-if="tagNoteCounts[tag._id] !== undefined">
                {{ tagNoteCounts[tag._id] }} note{{ tagNoteCounts[tag._id] !== 1 ? 's' : '' }}
              </span>
              <span v-else class="loading-count">
                <div class="spinner-border spinner-border-sm" role="status"></div>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    <!-- View Note Modal -->
    <div v-if="showNoteView" class="note-view-overlay" @click.self="closeNoteView">
      <div class="note-view-container">
        <div class="note-view-header">
          <h3>{{ viewingNote.title }}</h3>
          <div class="note-view-actions">
            <button class="close-button" @click="closeNoteView">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div class="note-view-content">
          <div class="note-view-tags" v-if="viewingNoteTags.length > 0">
            <span 
              v-for="tag in viewingNoteTags" 
              :key="tag._id" 
              class="tag-badge" 
              :style="{ backgroundColor: tag.color || '#666' }"
            >
              {{ tag.name || 'Tag' }}
            </span>
          </div>
          <div class="note-view-text">
            {{ viewingNote.content }}
          </div>
          <div class="note-view-meta">
            <div class="meta-info">
              <div>
                Created: {{ formatLocalDatetime(viewingNote.createdAt) }}
              </div>
              <div v-if="viewingNote.updatedAt && isNoteUpdated(viewingNote)">
                Updated: {{ formatLocalDatetime(viewingNote.updatedAt) }}
              </div>
              <div v-if="viewingNote.done" class="note-status done">
                <i class="bi bi-check-circle-fill"></i> Marked as Done
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUserById, getUserStats, getNotesByTag } from '../helpers/api'
import { formatLocalDatetime } from '../helpers/utils'
import NoteCard from '../components/NoteCard.vue'
import Swal from 'sweetalert2'

export default {
  name: 'UserDetail',
  components: {
    NoteCard
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userId = route.params.id
    
    // State variables for user data
    const user = ref(null)
    const userStats = ref(null)
    const userNotes = ref([])
    const userTags = ref([])
    const tagNoteCounts = ref({})
    const isLoading = ref(false)
    const error = ref(null)
    
    // Note viewing state
    const showNoteView = ref(false)
    const viewingNote = ref({})
    
    // Compute tags for the currently viewing note
    const viewingNoteTags = computed(() => {
      if (!viewingNote.value.tags || !Array.isArray(viewingNote.value.tags) || !userTags.value.length) {
        return []
      }
      
      const noteTagIds = viewingNote.value.tags.map(tag => 
        typeof tag === 'object' ? tag._id : String(tag)
      )
      
      return userTags.value.filter(tag => 
        noteTagIds.includes(tag._id) || noteTagIds.includes(String(tag._id))
      )
    })
    
    // Extract user initials from name for avatar
    const getUserInitials = (user) => {
      if (!user.name) return '?'
      return user.name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
    }
    
    // Show error notification toast
    const showErrorAlert = (message) => {
      Swal.fire({
        title: 'Error!',
        text: message,
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        iconColor: '#F44336'
      })
    }
    
    // Fetch user details, notes and tags
    const fetchUserAndData = async () => {
      if (!userId) return
      
      isLoading.value = true
      error.value = null
      
      try {
        // Fetch user details
        const userResponse = await getUserById(userId)
        
        if (!userResponse.success) {
          throw new Error(userResponse.error || 'Failed to fetch user details')
        }
        
        user.value = userResponse.data
        
        // Fetch user stats including notes and tags
        const statsResponse = await getUserStats(userId)
        
        if (statsResponse.success) {
          userStats.value = statsResponse.data
          userNotes.value = statsResponse.data.notes || []
          userTags.value = statsResponse.data.tags || []
          
          // Count notes per tag
          await countNotesForTags()
        } else {
          throw new Error(statsResponse.error || 'Failed to fetch user stats')
        }
        
        isLoading.value = false
      } catch (err) {
        console.error('Error fetching user details:', err)
        error.value = 'Failed to load user details. ' + (err.message || 'Please try again.')
        isLoading.value = false
        showErrorAlert('Failed to load user details.')
      }
    }
    
    // Get count of notes for each tag
    const countNotesForTags = async () => {
      // Reset counts
      tagNoteCounts.value = {}
      
      // Fetch counts for each tag
      for (const tag of userTags.value) {
        try {
          const response = await getNotesByTag(tag._id, userId)
          tagNoteCounts.value[tag._id] = response.data?.length || 0
        } catch (err) {
          console.error(`Error fetching note count for tag ${tag._id}:`, err)
          tagNoteCounts.value[tag._id] = 0
        }
      }
    }
    
    // Navigate back to users list
    const goBack = () => {
      router.push('/admin/users')
    }
    
    // Open note view modal
    const viewNote = (note) => {
      viewingNote.value = { ...note }
      showNoteView.value = true
    }
    
    // Close note view modal
    const closeNoteView = () => {
      showNoteView.value = false
      viewingNote.value = {}
    }
    
    // Navigate to the tag's notes page
    const navigateToTagNotes = (tag) => {
      router.push(`/admin/users/${userId}/tags/${tag._id}`);
    }
    
    // Check if note was updated (more than 1 minute after creation)
    const isNoteUpdated = (note) => {
      if (!note.createdAt || !note.updatedAt) return false
      
      const createdAt = new Date(note.createdAt).getTime()
      const updatedAt = new Date(note.updatedAt).getTime()
      
      return updatedAt > createdAt + 60000 // 1 minute difference
    }
    
    // Load data when component mounts
    onMounted(() => {
      fetchUserAndData()
    })
    
    return {
      user,
      userStats,
      userNotes,
      userTags,
      tagNoteCounts,
      isLoading,
      error,
      getUserInitials,
      goBack,
      fetchUserAndData,
      viewNote,
      closeNoteView,
      showNoteView,
      viewingNote,
      viewingNoteTags,
      navigateToTagNotes,
      isNoteUpdated,
      formatLocalDatetime
    }
  }
}
</script>

<style scoped>
.user-detail-view {
  padding: 20px;
}

.view-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.user-email {
  margin: 4px 0 0 0;
  color: var(--secondary);
  font-size: 14px;
}

.badge-admin {
  display: inline-block;
  background-color: #8B5CF6;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  margin-top: 4px;
}

.badge-user {
  display: inline-block;
  background-color: #4CAF50; /* A green color for users */
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  margin-top: 4px;
}

.loading-container {
  text-align: center;
  padding: 48px 0;
  color: var(--secondary);
}

.error-message {
  text-align: center;
  padding: 20px;
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 8px;
  margin: 20px 0;
}

.section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.subsection-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.note-count,
.tag-count {
  color: var(--secondary);
  font-size: 14px;
}

.section-divider {
  height: 1px;
  background-color: var(--border);
  margin: 30px 0;
}

.notes-grid,
.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 30px 0;
  color: var(--secondary);
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.tag-card {
  background-color: var(--background-alt);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.tag-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.tag-info {
  display: flex;
  align-items: center;
}

.tag-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}

.tag-name {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.tag-count {
  font-size: 12px;
  color: var(--secondary);
  margin-top: 8px;
  margin-left: 36px;
}

.loading-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-style: italic;
}

.spinner-border-sm {
  width: 0.8rem;
  height: 0.8rem;
  border-width: 0.1em;
}

/* Note View Modal Styles */
.note-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.note-view-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.note-view-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-view-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.note-view-actions {
  display: flex;
  gap: 8px;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.note-view-content {
  padding: 20px;
  overflow-y: auto;
}

.note-view-tags {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-badge {
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  color: white;
  display: inline-block;
}

.note-view-text {
  white-space: pre-wrap;
  margin-bottom: 24px;
  line-height: 1.6;
  color: var(--text-primary);
}

.note-view-meta {
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--secondary);
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.note-status {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.note-status.done {
  color: #4CAF50;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .notes-grid,
  .tags-grid {
    grid-template-columns: 1fr;
  }
}
</style> 
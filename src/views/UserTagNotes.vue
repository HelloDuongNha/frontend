<template>
  <div class="user-tag-notes-view">
    <div class="view-header">
      <div class="header-content">
        <button class="btn btn-outline-secondary back-btn" @click="goBack">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <div v-if="tag && user" class="tag-header-info">
          <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
          <div>
            <h2 class="section-title">{{ tag.name }}</h2>
            <p class="subtitle">Notes for {{ user.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading notes...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchData" class="btn btn-primary">Try Again</button>
    </div>
    
    <div v-else class="content">
      <div v-if="notes.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No Notes</h3>
        <p>No notes found with this tag for this user.</p>
      </div>
      
      <div v-else class="notes-grid">
        <NoteCard 
          v-for="note in notes" 
          :key="note._id"
          :note="note"
          :allTags="[tag]"
          :readOnly="true"
          @click="viewNote(note)"
        />
      </div>
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
          <div class="note-view-tags" v-if="tag">
            <span class="tag-badge" :style="{ backgroundColor: tag.color }">
              {{ tag.name }}
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUserById, getTagById, getNotesByTag } from '../helpers/api'
import { formatLocalDatetime } from '../helpers/utils'
import NoteCard from '../components/NoteCard.vue'

export default {
  name: 'UserTagNotes',
  components: {
    NoteCard
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userId = route.params.userId
    const tagId = route.params.tagId
    
    // State variables
    const user = ref(null)
    const tag = ref(null)
    const notes = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    
    // Note viewing state
    const showNoteView = ref(false)
    const viewingNote = ref({})
    
    // Fetch user data by ID
    const fetchUser = async () => {
      try {
        const response = await getUserById(userId)
        
        if (response.success) {
          user.value = response.data
          return true
        } else {
          throw new Error(response.error || 'Failed to fetch user details')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        error.value = 'Failed to load user details. ' + (err.message || '')
        return false
      }
    }
    
    // Fetch tag data by ID
    const fetchTag = async () => {
      try {
        const response = await getTagById(tagId)
        
        if (response.data) {
          tag.value = response.data
          return true
        } else {
          throw new Error('Tag not found')
        }
      } catch (err) {
        console.error('Error fetching tag:', err)
        error.value = 'Failed to load tag details. ' + (err.message || '')
        return false
      }
    }
    
    // Fetch notes for the specific tag and user
    const fetchNotes = async () => {
      try {
        const response = await getNotesByTag(tagId, userId)
        
        if (response.data) {
          notes.value = response.data
          return true
        } else {
          throw new Error('Failed to fetch notes')
        }
      } catch (err) {
        console.error('Error fetching notes:', err)
        error.value = 'Failed to load notes. ' + (err.message || '')
        return false
      }
    }
    
    // Fetch all required data in parallel
    const fetchData = async () => {
      isLoading.value = true
      error.value = null
      
      try {
        const [userSuccess, tagSuccess, notesSuccess] = await Promise.all([
          fetchUser(),
          fetchTag(),
          fetchNotes()
        ])
        
        if (!userSuccess || !tagSuccess || !notesSuccess) {
          throw new Error('Failed to fetch all required data')
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        error.value = err.message || 'Failed to load data'
      } finally {
        isLoading.value = false
      }
    }
    
    // Navigate back to user detail page
    const goBack = () => {
      router.push(`/admin/users/${userId}`)
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
    
    // Check if note was updated (more than 1 minute after creation)
    const isNoteUpdated = (note) => {
      if (!note.createdAt || !note.updatedAt) return false
      
      const createdAt = new Date(note.createdAt).getTime()
      const updatedAt = new Date(note.updatedAt).getTime()
      
      return updatedAt > createdAt + 60000 // 1 minute difference
    }
    
    // Load data when component mounts
    onMounted(() => {
      fetchData()
    })
    
    return {
      user,
      tag,
      notes,
      isLoading,
      error,
      viewingNote,
      showNoteView,
      goBack,
      viewNote,
      closeNoteView,
      fetchData,
      isNoteUpdated,
      formatLocalDatetime
    }
  }
}
</script>

<style scoped>
.user-tag-notes-view {
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

.tag-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  margin: 4px 0 0 0;
  color: var(--secondary);
  font-size: 14px;
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

.empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
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
  
  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style> 
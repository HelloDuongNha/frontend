<template>
  <div class="tag-detail-view">
    <div class="view-header">
      <div class="header-content">
        <button class="btn btn-outline-secondary back-btn" @click="goBack">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <h2 v-if="tag" class="section-title">
          <span class="tag-color-circle" :style="{ backgroundColor: tag.color }"></span>
          {{ tag.name }}
        </h2>
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
      <button @click="fetchTagAndNotes" class="btn btn-primary">Try Again</button>
    </div>
    
    <div v-else-if="notes.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>No Notes Found</h3>
      <p>This tag doesn't have any active notes. Notes in the trash aren't shown here.</p>
      <button class="btn btn-primary" @click="createNewNote">Create a New Note</button>
    </div>
    
    <div v-else class="notes-container">
      <div class="notes-grid">
        <NoteCard
          v-for="note in sortedNotes" 
          :key="note._id"
          :note="note"
          :allTags="[tag]"
          @edit="editNote"
          @trash="moveNoteToTrash"
          @toggle-done="toggleNoteDoneStatus"
          @click="viewNote(note)"
        />
        <div class="note-card new-note" @click="createNewNote">
          <div class="new-note-content">
            <span class="new-note-icon">+</span>
            <span>New Note</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Note Form Modal -->
    <NoteForm 
      v-if="showNoteForm"
      :note="currentNote"
      :userId="userId"
      @submit="saveNote"
      @cancel="closeNoteForm"
    />
    
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
          <div class="note-view-tags">
            <span 
              class="tag-badge" 
              :style="{ backgroundColor: tag?.color || '#666' }"
            >
              {{ tag?.name || 'Tag' }}
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
            </div>
            
            <div class="note-status-toggle">
              <label class="checkbox-container">
                <input 
                  type="checkbox" 
                  :checked="viewingNote.done" 
                  @change="toggleViewingNoteDone"
                >
                <span class="checkmark"></span>
                Mark as Done
              </label>
            </div>
          </div>
          
          <button class="edit-button" @click="editNote(viewingNote)">
            <i class="bi bi-pencil"></i> Edit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { getTagById, createNote, updateNote, moveToTrash, getNotesByTag, getUserId, toggleNoteDone } from '../helpers/api'
import { formatLocalDatetime } from '../helpers/utils'
import NoteCard from '../components/NoteCard.vue'
import NoteForm from '../components/NoteForm.vue'
import TagBadge from '../components/TagBadge.vue'
import Swal from 'sweetalert2'

export default {
  name: 'TagDetailView',
  components: {
    NoteCard,
    NoteForm,
    TagBadge
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    let tagId = route.params.id
    
    // User authentication and state variables
    const userId = ref(getUserId())
    const tag = ref(null)
    const notes = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    
    // Note viewing/editing state
    const showNoteForm = ref(false)
    const currentNote = ref({})
    const showNoteView = ref(false)
    const viewingNote = ref({})
    
    // Show success notification toast
    const showSuccessAlert = (message) => {
      Swal.fire({
        title: 'Success!',
        text: message,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        iconColor: '#4CAF50'
      })
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
    
    // Fetch tag details and associated notes
    const fetchTagAndNotes = async () => {
      if (!tagId) return
      
      isLoading.value = true
      error.value = null
      
      try {
        // Ensure we have a valid userId
        const currentUserId = userId.value ;
        
        // Fetch tag details
        const tagResponse = await getTagById(tagId)
        tag.value = tagResponse.data
        
        // Fetch notes associated with this tag using the dedicated endpoint
        const notesResponse = await getNotesByTag(tagId, currentUserId)
        console.log('Tag notes response:', notesResponse);
        notes.value = notesResponse.data || []
        
        isLoading.value = false
      } catch (err) {
        console.error('Error fetching tag details:', err)
        error.value = 'Failed to load tag details. Please try again.'
        showErrorAlert('Failed to load tag details.')
        isLoading.value = false
      }
    }
    
    // Navigate back to tags list
    const goBack = () => {
      router.push('/tags')
    }
    
    // Initialize new note with current tag pre-selected
    const createNewNote = () => {
      currentNote.value = {
        title: '',
        content: '',
        userId: userId.value,
        tags: [tagId]
      }
      showNoteForm.value = true
    }
    
    // Open the note editor with selected note data
    const editNote = (note) => {
      currentNote.value = { ...note }
      showNoteForm.value = true
    }
    
    // Open note details view
    const viewNote = (note) => {
      viewingNote.value = { ...note }
      showNoteView.value = true
    }
    
    // Close note view modal
    const closeNoteView = () => {
      showNoteView.value = false
      viewingNote.value = {}
    }
    
    // Close note form modal
    const closeNoteForm = () => {
      showNoteForm.value = false
      currentNote.value = {}
    }
    
    // Save a note (create or update)
    const saveNote = async (noteData) => {
      isLoading.value = true
      
      try {
        if (noteData._id) {
          // Update existing note
          await updateNote(noteData._id, noteData)
          showSuccessAlert('Note updated successfully!')
        } else {
          // Create new note
          await createNote(noteData)
          showSuccessAlert('Note created successfully!')
        }
        
        await fetchTagAndNotes()
        closeNoteForm()
      } catch (err) {
        console.error('Error saving note:', err)
        showErrorAlert('Failed to save note.')
      } finally {
        isLoading.value = false
      }
    }
    
    // Move note to trash (soft delete)
    const moveNoteToTrash = async (noteId) => {
      try {
        isLoading.value = true
        
        await moveToTrash(noteId)
        notes.value = notes.value.filter(note => note._id !== noteId)
        
        showSuccessAlert('Note moved to trash successfully!')
      } catch (err) {
        console.error('Error moving note to trash:', err)
        showErrorAlert('Failed to move note to trash.')
      } finally {
        isLoading.value = false
      }
    }
    
    // Check if note has been updated (more than 1 minute after creation)
    const isNoteUpdated = (note) => {
      if (!note.createdAt || !note.updatedAt) return false
      
      const createdAt = new Date(note.createdAt).getTime()
      const updatedAt = new Date(note.updatedAt).getTime()
      
      return updatedAt > createdAt + 60000 // 1 minute difference
    }

    // Sort notes: not done first, then by update date
    const sortedNotes = computed(() => {
      return [...notes.value].sort((a, b) => {
        // Sort: not done first, then done
        if (a.done && !b.done) return 1
        if (!a.done && b.done) return -1
        
        // If both have same done status, sort by updatedAt (newest first)
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })
    })

    // Toggle note completion status
    const toggleNoteDoneStatus = async (note) => {
      try {
        isLoading.value = true
        
        const newDoneStatus = !note.done
        
        await toggleNoteDone(note._id, newDoneStatus)
        
        // Update the note in the local array
        const index = notes.value.findIndex(n => n._id === note._id)
        if (index !== -1) {
          notes.value[index].done = newDoneStatus
        }
        
        showSuccessAlert(`Note marked as ${newDoneStatus ? 'done' : 'undone'}!`)
        isLoading.value = false
      } catch (err) {
        console.error('Error toggling note status:', err)
        showErrorAlert('Failed to update note status. Please try again.')
        isLoading.value = false
      }
    }

    // Toggle completion status of the currently viewing note
    const toggleViewingNoteDone = async (event) => {
      try {
        const newDoneStatus = event.target.checked
        
        await toggleNoteDone(viewingNote.value._id, newDoneStatus)
        
        // Update local state
        viewingNote.value.done = newDoneStatus
        
        // Also update in the notes array
        const index = notes.value.findIndex(n => n._id === viewingNote.value._id)
        if (index !== -1) {
          notes.value[index].done = newDoneStatus
        }
        
        showSuccessAlert(`Note marked as ${newDoneStatus ? 'done' : 'undone'}!`)
      } catch (err) {
        console.error('Error toggling note status:', err)
        showErrorAlert('Failed to update note status. Please try again.')
      }
    }
    
    // Setup event listeners for refreshing tag notes
    const listenForGlobalEvents = () => {
      const handleRefresh = (event) => {
        if (event.detail?.tagId === tagId) {
          // Refresh the tag notes
          fetchTagAndNotes()
        }
      }
      
      window.addEventListener('refresh-tag-notes', handleRefresh)
      
      // Cleanup listener on unmount
      return () => {
        window.removeEventListener('refresh-tag-notes', handleRefresh)
      }
    }
    
    onMounted(() => {
      fetchTagAndNotes()
      
      // Setup global event listeners
      const cleanup = listenForGlobalEvents()
      
      // Watch for route parameter changes to refresh data
      watch(() => route.params.id, (newTagId, oldTagId) => {
        if (newTagId !== oldTagId) {
          // Update the local tagId ref
          tagId = newTagId
          // Fetch data for the new tag
          fetchTagAndNotes()
        }
      }, { immediate: true })
      
      // Return cleanup function for onUnmounted
      return cleanup
    })

    // Handle route updates for tag ID changes
    onBeforeRouteUpdate((to, from) => {
      if (to.params.id !== from.params.id) {
        // Update the local tagId ref
        tagId = to.params.id
        // Fetch data for the new tag
        fetchTagAndNotes()
      }
    })
    
    return {
      tag,
      notes,
      sortedNotes,
      isLoading,
      error,
      showNoteForm,
      currentNote,
      showNoteView,
      viewingNote,
      userId,
      goBack,
      createNewNote,
      editNote,
      viewNote,
      closeNoteView,
      closeNoteForm,
      saveNote,
      moveNoteToTrash,
      toggleNoteDoneStatus,
      toggleViewingNoteDone,
      isNoteUpdated,
      fetchTagAndNotes,
      formatLocalDatetime
    }
  }
}
</script>

<style scoped>
.tag-detail-view {
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

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-color-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.notes-container {
  margin-top: 24px;
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

.error-message {
  text-align: center;
  padding: 20px;
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 8px;
  margin: 20px 0;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.new-note {
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.new-note:hover {
  border-color: var(--accent);
}

.new-note-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--secondary);
}

.new-note-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

/* Note view specific styles only */
.note-view-tags .tag-badge {
  margin-right: 8px;
  margin-bottom: 8px;
}

.note-view-text {
  white-space: pre-wrap;
  margin-bottom: 24px;
  line-height: 1.6;
}

.note-view-meta {
  display: flex;
  flex-direction: column;
  gap: 15px;
  font-size: 12px;
  color: var(--secondary);
  border-top: 1px solid var(--border);
  padding-top: 16px;
  position: relative;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.note-status-toggle {
  margin-top: 10px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
  color: var(--text-primary);
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 18px;
  width: 18px;
  background-color: #fff;
  border: 1px solid var(--border);
  border-radius: 3px;
  margin-right: 8px;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: #f5f5f5;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--accent);
  border-color: var(--accent);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.edit-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;
}

.edit-button:hover {
  background-color: #0069d9;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-content {
    margin-bottom: 10px;
  }
}
</style> 
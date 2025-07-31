<template>
  <div class="trash-view">
    <div class="view-header">
      <h2 class="section-title">Trash</h2>
      <div class="view-actions">
        <button 
          class="btn btn-outline-success me-2" 
          @click="confirmRestoreAll"
          :disabled="trashedNotes.length === 0"
        >
          <i class="bi bi-arrow-counterclockwise"></i> Restore All
        </button>
        <button 
          class="btn btn-outline-danger" 
          @click="confirmDeleteAll"
          :disabled="trashedNotes.length === 0"
        >
          <i class="bi bi-trash"></i> Delete All
        </button>
      </div>
    </div>
    
    <div class="filter-section">
      <div class="search-container">
        <input 
          type="text" 
          placeholder="Search in trash..." 
          v-model="searchQuery"
          @input="performSearch"
          class="search-input"
        >
        <button class="search-button">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading trashed notes...</p>
    </div>
    
    <div v-else-if="trashedNotes.length === 0" class="empty-state">
      <div class="empty-icon">🗑️</div>
      <h2>Trash is Empty</h2>
      <p>No deleted notes found</p>
    </div>
    
    <div v-else-if="isSearchActive" class="search-results-section">
      <div class="section-header">
        <div class="search-results-header">
          <div class="results-info">
            <h2 class="section-title">
              Found {{ filteredNotes.length }} result{{ filteredNotes.length !== 1 ? 's' : '' }}
            </h2>
            <button class="clear-search-button" @click="clearSearch">
              <i class="bi bi-x-circle"></i> Clear Search
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="filteredNotes.length === 0" class="no-results">
        No trashed notes found matching your search.
      </div>
      
      <div v-else class="notes-container">
        <div class="row g-4">
          <div 
            v-for="note in filteredNotes" 
            :key="note._id" 
            class="mb-4 col-md-4 col-sm-6"
          >
            <div class="card note-card trash-note">
              <div class="card-body">
                <h5 class="card-title">{{ note.title }}</h5>
                <p class="card-text text-truncate">{{ note.content }}</p>
                
                <div class="tags-container">
                  <span 
                    v-for="tag in note.tags" 
                    :key="tag._id" 
                    class="tag-badge"
                    :style="{ backgroundColor: tag.color }"
                  >
                    {{ tag.name }}
                  </span>
                  <span v-if="!note.tags || note.tags.length === 0" class="no-tags">
                    No tags
                  </span>
                </div>
                
                <div class="meta-info">
                  <span class="date">
                    Created: {{ formatDate(note.createdAt, 'DD/MM/YYYY') }}
                  </span>
                </div>
                
                <div class="mt-3 trash-actions">
                  <button 
                    class="btn btn-success btn-sm w-100 me-2" 
                    @click="handleRestore(note)"
                    title="Restore note"
                  >
                    <i class="bi bi-arrow-counterclockwise"></i> Restore
                  </button>
                  <button 
                    class="btn btn-danger btn-sm w-100" 
                    @click="handleDelete(note)"
                    title="Delete permanently"
                  >
                    <i class="bi bi-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="notes-container">
      <div class="row g-4">
        <div 
          v-for="note in filteredNotes" 
          :key="note._id" 
          class="mb-4 col-md-4 col-sm-6"
        >
          <div class="card note-card trash-note">
            <div class="card-body">
              <h5 class="card-title">{{ note.title }}</h5>
              <p class="card-text text-truncate">{{ note.content }}</p>
              
              <div class="tags-container">
                <span 
                  v-for="tag in note.tags" 
                  :key="tag._id" 
                  class="tag-badge"
                  :style="{ backgroundColor: tag.color }"
                >
                  {{ tag.name }}
                </span>
                <span v-if="!note.tags || note.tags.length === 0" class="no-tags">
                  No tags
                </span>
              </div>
              
              <div class="meta-info">
                <span class="date">
                  Created: {{ formatDate(note.createdAt, 'DD/MM/YYYY') }}
                </span>
              </div>
              
              <div class="mt-3 trash-actions">
                <button 
                  class="btn btn-success btn-sm w-100 me-2" 
                  @click="handleRestore(note)"
                  title="Restore note"
                >
                  <i class="bi bi-arrow-counterclockwise"></i> Restore
                </button>
                <button 
                  class="btn btn-danger btn-sm w-100" 
                  @click="handleDelete(note)"
                  title="Delete permanently"
                >
                  <i class="bi bi-trash"></i> Delete
                </button>
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
import { getTrashedNotes, restoreFromTrash, deleteNote, searchTrashedNotes, getUserId } from '../helpers/api'
import Swal from 'sweetalert2'

export default {
  name: 'TrashView',
  
  setup() {
    // State management
    const userId = ref(getUserId())
    const trashedNotes = ref([])
    const isLoading = ref(false)
    const searchQuery = ref('')
    const isSearchActive = ref(false)
    const searchResults = ref([])
    const searchDebounceTimeout = ref(null)
    
    // Filter notes based on search query
    const filteredNotes = computed(() => {
      if (isSearchActive.value) {
        return searchResults.value
      }
      
      if (!searchQuery.value) {
        return trashedNotes.value
      }
      
      const query = searchQuery.value.toLowerCase()
      return trashedNotes.value.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query)
      )
    })
    
    // Format date helper
    const formatDate = (dateString, format = 'DD MMM YYYY') => {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      
      if (format === 'DD/MM/YYYY') {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
      
      // Default format
      const options = { year: 'numeric', month: 'short', day: 'numeric' }
      return date.toLocaleDateString(undefined, options)
    }

    // Handle search input with debounce for API calls
    const performSearch = () => {
      // Clear previous timeout
      if (searchDebounceTimeout.value) {
        clearTimeout(searchDebounceTimeout.value)
      }
      
      // If search query is empty, show all notes
      if (!searchQuery.value.trim()) {
        searchResults.value = []
        isSearchActive.value = false
        return
      }
      
      // Set a short debounce to avoid excessive searching while typing
      searchDebounceTimeout.value = setTimeout(async () => {
        try {
          isSearchActive.value = true
          // Use current user ID to only search notes for the current user
          const response = await searchTrashedNotes(searchQuery.value, userId.value)
          searchResults.value = response.data
        } catch (err) {
          console.error('Error performing search:', err)
          searchResults.value = []
          showErrorAlert('Failed to search trashed notes. Please try again.')
        }
      }, 300) // 300ms debounce
    }
    
    // Load trashed notes from API
    const loadTrashedNotes = async () => {
      isLoading.value = true
      try {
        // Get latest user ID to ensure we're using the current ID
        const currentUserId = getUserId()
        userId.value = currentUserId
        
        const response = await getTrashedNotes(currentUserId)
        trashedNotes.value = response.data || []
      } catch (error) {
        console.error('Error loading trashed notes:', error)
        showErrorAlert('Failed to load trashed notes. Please try again.')
      } finally {
        isLoading.value = false
      }
    }
    
    // Show success alert notification
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
    
    // Show error alert notification
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
    
    // Show restore confirmation and handle note restoration
    const handleRestore = (note) => {
      Swal.fire({
        title: 'Restore Note',
        text: `Are you sure you want to restore "${note.title}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, restore it!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#4CAF50',
        cancelButtonColor: '#6c757d'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await restoreFromTrash(note._id)
            
            // Remove from local notes array
            trashedNotes.value = trashedNotes.value.filter(n => n._id !== note._id)
            
            // Also remove from search results if needed
            if (isSearchActive.value) {
              searchResults.value = searchResults.value.filter(n => n._id !== note._id)
            }
            
            showSuccessAlert(`Note "${note.title}" has been restored.`)
          } catch (error) {
            console.error('Error restoring note:', error)
            showErrorAlert('Failed to restore note. Please try again.')
          }
        }
      })
    }
    
    // Show delete confirmation and handle permanent deletion
    const handleDelete = (note) => {
      Swal.fire({
        title: 'Delete Permanently',
        text: `Are you sure you want to permanently delete "${note.title}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await deleteNote(note._id)
            
            // Remove from local notes array
            trashedNotes.value = trashedNotes.value.filter(n => n._id !== note._id)
            
            // Also remove from search results if needed
            if (isSearchActive.value) {
              searchResults.value = searchResults.value.filter(n => n._id !== note._id)
            }
            
            showSuccessAlert(`Note "${note.title}" has been permanently deleted.`)
          } catch (error) {
            console.error('Error deleting note:', error)
            showErrorAlert('Failed to delete note. Please try again.')
          }
        }
      })
    }
    
    // Show confirmation dialog for restoring all notes
    const confirmRestoreAll = () => {
      if (trashedNotes.value.length === 0) return
      
      Swal.fire({
        title: 'Restore All Notes',
        text: `Are you sure you want to restore all ${trashedNotes.value.length} trashed notes?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, restore all!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#4CAF50',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          restoreAllNotes()
        }
      })
    }
    
    // Restore all trashed notes
    const restoreAllNotes = async () => {
      if (trashedNotes.value.length === 0) return
      
      isLoading.value = true
      let successCount = 0
      let errorCount = 0
      
      // Process each note sequentially
      for (const note of trashedNotes.value) {
        try {
          await restoreFromTrash(note._id)
          successCount++
        } catch (error) {
          console.error(`Error restoring note ${note._id}:`, error)
          errorCount++
        }
      }
      
      isLoading.value = false
      
      if (successCount > 0) {
        showSuccessAlert(`Successfully restored ${successCount} notes.`)
        // Refresh the trashed notes list
        await loadTrashedNotes()
      }
      
      if (errorCount > 0) {
        showErrorAlert(`Failed to restore ${errorCount} notes.`)
      }
    }
    
    // Show confirmation dialog for deleting all notes
    const confirmDeleteAll = () => {
      if (trashedNotes.value.length === 0) return
      
      Swal.fire({
        title: 'Delete All Permanently',
        text: `Are you sure you want to permanently delete all ${trashedNotes.value.length} trashed notes? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete all!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteAllNotes()
        }
      })
    }
    
    // Permanently delete all trashed notes
    const deleteAllNotes = async () => {
      if (trashedNotes.value.length === 0) return
      
      isLoading.value = true
      let successCount = 0
      let errorCount = 0
      
      // Process each note sequentially
      for (const note of trashedNotes.value) {
        try {
          await deleteNote(note._id)
          successCount++
        } catch (error) {
          console.error(`Error deleting note ${note._id}:`, error)
          errorCount++
        }
      }
      
      isLoading.value = false
      
      if (successCount > 0) {
        showSuccessAlert(`Successfully deleted ${successCount} notes permanently.`)
        // Refresh the trashed notes list
        await loadTrashedNotes()
      }
      
      if (errorCount > 0) {
        showErrorAlert(`Failed to delete ${errorCount} notes.`)
      }
    }

    // Clear search and reset results
    const clearSearch = () => {
      searchQuery.value = ''
      searchResults.value = []
      isSearchActive.value = false
    }
    
    // Initialize component
    onMounted(() => {
      loadTrashedNotes()
    })
    
    return {
      trashedNotes,
      filteredNotes,
      isLoading,
      searchQuery,
      isSearchActive,
      searchResults,
      formatDate,
      performSearch,
      handleRestore,
      handleDelete,
      confirmRestoreAll,
      confirmDeleteAll,
      clearSearch
    }
  }
}
</script>

<style scoped>
.trash-view {
  padding: 20px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.filter-section {
  margin-bottom: 20px;
}

.search-container {
  position: relative;
  max-width: 400px;
}

.search-input {
  padding: 8px 12px 8px 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  width: 100%;
  box-sizing: border-box; /* Include padding and border in element's total width */
}

.search-button {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background-color: transparent;
  border: none;
  padding: 0 10px;
  cursor: pointer;
  color: var(--secondary);
  z-index: 10; /* Ensure it's above the input */
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.note-card {
  height: 100%;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  border-color: var(--border);
}

.trash-note {
  border-left: 3px solid #dc3545;
}

.note-card:hover {
  box-shadow: var(--shadow-md);
}

.card-title {
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 16px;
}

.card-text {
  color: var(--text-secondary);
  margin-bottom: 12px;
  height: 48px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2; /* Add this standard property */
  -webkit-box-orient: vertical;
}

.tags-container {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px; /* Ensure minimum height even without tags */
}

.no-tags {
  font-size: 0.75rem;
  color: var(--secondary);
  font-style: italic;
  opacity: 0.6;
}

.tag-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  color: black;
  margin-right: 5px;
}

.meta-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--secondary);
}

.trash-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  opacity: 1 !important;
  visibility: visible !important;
}

.trash-actions .btn {
  opacity: 1 !important;
  font-weight: 500;
  visibility: visible !important;
  display: block !important;
  color: #fff;
}

.trash-actions .btn-success {
  background-color: #198754;
  border-color: #198754;
}

.trash-actions .btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
}

.search-results-section {
  margin-top: 20px;
}

.search-results-header {
  display: flex;
  margin-bottom: 15px;
  width: 100%;
}

.results-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.clear-search-button {
  background-color: #dc3545;
  color: white;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
  text-align: center;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.clear-search-button:hover {
  background-color: #c82333;
}

.no-results {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px;
  font-style: italic;
}

@media screen and (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .view-actions {
    margin-top: 12px;
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  
  .search-container {
    width: 100%;
    margin-top: 12px;
  }
}
</style> 
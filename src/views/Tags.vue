<template>
  <div class="tags-page">
    <div class="section-header">
      <h2 class="section-title">My Tags</h2>
    </div>
    
    <!-- Search Bar -->
    <div class="filter-section">
      <div class="search-container">
        <input 
          type="text"
          class="search-input"
          placeholder="Search tags..."
          v-model="searchQuery"
          @input="performSearch"
        >
        <button class="search-button">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </div>
    
    <!-- Tags List -->
    <div v-if="isLoading" class="loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading tags...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchTags" class="retry-btn btn btn-primary">Try Again</button>
    </div>
    
    <div v-else-if="filteredTags.length > 0" class="tags-grid">
      <!-- Search Results Header (only when search is active) -->
      <div v-if="isSearchActive" class="search-results-header">
        <div class="results-info">
          <h2 class="section-title">
            Found {{ filteredTags.length }} result{{ filteredTags.length !== 1 ? 's' : '' }}
          </h2>
          <button class="clear-search-button" @click="clearSearch">
            <i class="bi bi-x-circle"></i> Clear Search
          </button>
        </div>
      </div>
      
      <div v-for="tag in filteredTags" :key="tag._id" class="tag-card" @click="navigateToTag(tag)">
        <div class="tag-row">
          <div class="tag-info">
            <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
            <h3 class="tag-name">{{ tag.name }}</h3>
          </div>
          <div class="tag-actions">
            <button class="edit-btn" @click.stop="editTag(tag)" title="Edit Tag">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="delete-btn" @click.stop="confirmDeleteTag(tag)" title="Delete Tag">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <div class="tag-count">
          <span v-if="tagNoteCounts[tag._id] !== undefined">
            {{ tagNoteCounts[tag._id] }} active note{{ tagNoteCounts[tag._id] !== 1 ? 's' : '' }}
          </span>
          <span v-else class="loading-count">
            <div class="spinner-border spinner-border-sm" role="status"></div>
          </span>
        </div>
      </div>
      
      <!-- Add New Tag Card -->
      <div class="tag-card new-tag" @click="openNewTagForm">
        <div class="new-tag-content">
          <span class="new-tag-icon">+</span>
          <span>New Tag</span>
        </div>
      </div>
    </div>
    
    <div v-else-if="filteredTags.length === 0 && !isSearchActive" class="empty-state">
      <div class="empty-icon">🏷️</div>
      <h3>No Tags Yet</h3>
      <p>Create your first tag to organize your notes better.</p>
      <button class="btn btn-primary mt-3" @click="openNewTagForm">Create a Tag</button>
    </div>
    
    <div v-else-if="filteredTags.length === 0 && isSearchActive" class="empty-search-results">
      <div class="empty-icon">🔍</div>
      <h3>No Matching Tags</h3>
      <p>No tags found matching your search.</p>
      <button class="btn btn-outline-secondary mt-3" @click="clearSearch">Clear Search</button>
    </div>
    
    <!-- Tag Form Modal -->
    <TagForm
      v-if="showTagForm"
      :tag="currentTag"
      :userId="userId"
      @submit="saveTag"
      @cancel="closeTagForm"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getTags, createTag, updateTag, deleteTag as apiDeleteTag, getNotesByTag, getUserId, searchTags } from '../helpers/api'
import { generateRandomColor } from '../helpers/utils'
import TagForm from '../components/TagForm.vue'
import Swal from 'sweetalert2'

export default {
  name: 'Tags',
  components: {
    TagForm
  },
  setup() {
    const router = useRouter()
    
    // State variables
    const userId = ref(getUserId())
    const tags = ref([])
    const tagNoteCounts = ref({})
    const isLoading = ref(false)
    const error = ref(null)
    const showTagForm = ref(false)
    const currentTag = ref({})
    
    // Search functionality state
    const searchQuery = ref('')
    const isSearchActive = ref(false)
    const searchResults = ref([])
    const searchDebounceTimeout = ref(null)
    
    // Show filtered tags based on search status
    const filteredTags = computed(() => {
      if (isSearchActive.value) {
        return searchResults.value
      }
      return tags.value
    })
    
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
        iconColor: '#4CAF50',
        customClass: {
          popup: 'success-toast-popup',
          title: 'success-toast-title',
          content: 'success-toast-content'
        }
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
        iconColor: '#F44336',
        customClass: {
          popup: 'error-toast-popup',
          title: 'error-toast-title',
          content: 'error-toast-content'
        }
      })
    }
    
    // Fetch all tags for the current user
    const fetchTags = async () => {
      try {
        isLoading.value = true
        error.value = null
        
        const response = await getTags(userId.value)
        tags.value = response.data || []
        
        // After fetching tags, get note counts for each tag
        fetchNoteCountsForTags()
        
        isLoading.value = false
      } catch (err) {
        console.error('Error fetching tags:', err)
        error.value = 'Failed to fetch tags'
        isLoading.value = false
        showErrorAlert('Failed to fetch tags. Please try again.')
      }
    }
    
    // Get count of notes for each tag
    const fetchNoteCountsForTags = async () => {
      // Reset counts
      tagNoteCounts.value = {}
      
      // Fetch counts for each tag
      for (const tag of tags.value) {
        try {
          const response = await getNotesByTag(tag._id, userId.value)
          tagNoteCounts.value[tag._id] = response.data.length
        } catch (err) {
          console.error(`Error fetching note count for tag ${tag._id}:`, err)
          tagNoteCounts.value[tag._id] = 0
        }
      }
    }
    
    // Navigate to tag detail page
    const navigateToTag = (tag) => {
      router.push(`/tags/${tag._id}`)
    }
    
    // Create new tag with random color
    const openNewTagForm = () => {
      currentTag.value = {
        name: '',
        color: generateRandomColor(),
        userId: userId.value
      }
      showTagForm.value = true
    }
    
    // Edit existing tag
    const editTag = (tag) => {
      currentTag.value = { ...tag }
      showTagForm.value = true
    }
    
    // Close tag form modal
    const closeTagForm = () => {
      showTagForm.value = false
      currentTag.value = {}
    }
    
    // Save tag (create or update)
    const saveTag = async (tagData) => {
      try {
        isLoading.value = true
        error.value = null
        
        if (tagData._id) {
          // Update existing tag
          await updateTag(tagData._id, tagData)
          const index = tags.value.findIndex(t => t._id === tagData._id)
          if (index !== -1) {
            tags.value[index] = tagData
          }
          
          showSuccessAlert('Tag updated successfully!')
        } else {
          // Create new tag
          const response = await createTag(tagData)
          if (response.data) {
            tags.value.push(response.data)
            showSuccessAlert('Tag created successfully!')
          }
        }
        
        closeTagForm()
        isLoading.value = false
        
        // Refresh tags
        await fetchTags()
      } catch (err) {
        console.error('Error saving tag:', err)
        error.value = 'Failed to save tag'
        isLoading.value = false
        showErrorAlert('Failed to save tag. Please try again.')
      }
    }
    
    // Show confirmation dialog before deleting tag
    const confirmDeleteTag = (tag) => {
      Swal.fire({
        title: 'Delete Tag',
        text: `Are you sure you want to delete "${tag.name}"? This will remove the tag from all notes.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteTag(tag._id)
        }
      })
    }
    
    // Delete tag and remove from all notes
    const deleteTag = async (tagId) => {
      try {
        isLoading.value = true
        error.value = null
        
        await apiDeleteTag(tagId)
        
        // Remove from local tags array
        tags.value = tags.value.filter(t => t._id !== tagId)
        
        isLoading.value = false
        showSuccessAlert('Tag deleted successfully!')
        
        // Refresh tags after changes
        await fetchTags()
      } catch (err) {
        console.error('Error deleting tag:', err)
        error.value = 'Failed to delete tag'
        isLoading.value = false
        showErrorAlert('Failed to delete tag. Please try again.')
      }
    }

    // Search tags with debounce to prevent excessive API calls
    const performSearch = () => {
      // Clear previous timeout
      if (searchDebounceTimeout.value) {
        clearTimeout(searchDebounceTimeout.value)
      }
      
      // If search query is empty, reset search state
      if (!searchQuery.value.trim()) {
        isSearchActive.value = false
        searchResults.value = []
        return
      }
      
      // Set a short debounce to avoid excessive API calls while typing
      searchDebounceTimeout.value = setTimeout(async () => {
        try {
          isSearchActive.value = true
          const response = await searchTags(searchQuery.value, userId.value)
          searchResults.value = response.data || []
        } catch (err) {
          console.error('Error searching tags:', err)
          searchResults.value = []
          showErrorAlert('Error searching tags. Please try again.')
        }
      }, 300) // 300ms debounce
    }
    
    // Clear search and reset to showing all tags
    const clearSearch = () => {
      searchQuery.value = ''
      isSearchActive.value = false
      searchResults.value = []
    }
    
    // Update search results when tags change
    watch(tags, () => {
      // If search is active, refresh search results
      if (isSearchActive.value && searchQuery.value) {
        performSearch()
      }
    })
    
    // Fetch tags when component mounts
    onMounted(() => {
      fetchTags()
    })
    
    return {
      userId,
      tags,
      tagNoteCounts,
      isLoading,
      error,
      showTagForm,
      currentTag,
      searchQuery,
      isSearchActive,
      filteredTags,
      fetchTags,
      navigateToTag,
      openNewTagForm,
      editTag,
      closeTagForm,
      saveTag,
      confirmDeleteTag,
      deleteTag,
      performSearch,
      clearSearch
    }
  }
}
</script>

<style scoped>
.tags-page {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.add-tag-btn {
  display: flex;
  align-items: center;
  background-color: var(--accent);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.add-tag-btn .icon {
  margin-right: 6px;
  font-weight: bold;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.error-message {
  text-align: center;
  padding: 20px;
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 8px;
  margin: 20px 0;
}

.retry-btn {
  margin-top: 10px;
  padding: 6px 12px;
  display: inline-block;
}

.filter-section {
  margin-bottom: 24px;
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
  box-sizing: border-box;
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
  z-index: 10;
}

.search-button:hover {
  background-color: var(--accent-dark);
}

.search-button i {
  font-size: 18px;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
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
  margin-left: 36px; /* Aligned with tag name (24px tag color width + 12px margin) */
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

.tag-actions {
  display: flex;
  gap: 8px;
}

.tag-actions button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.tag-actions button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.edit-btn {
  color: var(--accent);
}

.delete-btn {
  color: #dc3545;
}

.new-tag {
  border: 2px dashed var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.new-tag:hover {
  border-color: var(--accent);
}

.new-tag-content {
  display: flex;
  align-items: center;
  color: var(--secondary);
  font-weight: 500;
}

.new-tag-icon {
  margin-right: 6px;
  font-size: 18px;
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

.empty-state h3 {
  margin-bottom: 8px;
  color: var(--primary);
}

.search-results-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  grid-column: 1 / -1;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.clear-search-button:hover {
  background-color: #c82333;
}

.empty-search-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--secondary);
}

.empty-search-results .empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.empty-search-results h3 {
  margin-bottom: 8px;
  color: var(--primary);
}

.empty-search-results p {
  margin-bottom: 20px;
}

.empty-search-results .btn {
  padding: 8px 16px;
  font-size: 1rem;
}

@media screen and (max-width: 768px) {
  .tags-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .add-tag-btn {
    margin-top: 12px;
  }
}
</style> 
<template>
  <div class="home">
    <!-- Search Bar -->
    <div class="filter-section">
      <div class="search-container">
        <input 
          type="text"
          class="search-input"
          placeholder="Search notes..."
          v-model="searchQuery"
          @input="performSearch"
        >
        <button class="search-button">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </div>
    
    <!-- My Notes Section - Only show if not in search results mode -->
    <section class="section" v-if="!isSearchActive">
      <div class="section-header">
        <h2 class="section-title">My Notes</h2>
      </div>
      
      <div class="tabs">
        <button 
          v-for="tab in noteTabs" 
          :key="tab.id"
          :class="['tab-button', { active: currentNoteTab === tab.id }]"
          @click="currentNoteTab = tab.id"
        >
          {{ tab.name }}
        </button>
        
        <div class="sort-dropdown-container">
          <button 
            class="sort-button" 
            @click="toggleSortDropdown"
          >
            <i class="bi bi-sort-down"></i> Sort & Filter
          </button>
          
          <div v-if="showSortDropdown" class="sort-dropdown">
            <div 
              v-for="option in sortOptions" 
              :key="option.id" 
              class="sort-option"
              @click="selectSortOption(option.id)"
            >
              <div class="radio-button">
                <div class="radio-inner" :class="{ active: currentSortOption === option.id }"></div>
              </div>
              <span>{{ option.name }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="notes-grid">
        <NoteCard 
          v-for="note in filteredNotes" 
          :key="note._id"
          :note="note"
          :allTags="tags"
          @edit="editNote"
          @delete="deleteNote"
          @trash="moveNoteToTrash"
          @toggle-done="toggleNoteDoneStatus"
          @click="viewNote(note)"
        />
        <div class="note-card new-note" @click="openNewNoteForm">
          <div class="new-note-content">
            <span class="new-note-icon">+</span>
            <span>New Note</span>
          </div>
        </div>
      </div>
    </section>
    
    <div class="section-divider"></div>
    
    <!-- Totals Section -->
    <section class="section" v-if="!isSearchActive">
      <div class="section-header">
        <h2 class="section-title">Totals</h2>
      </div>
      
      <div class="notes-grid">
        <NoteCard 
          v-for="note in allNotes" 
          :key="note._id"
          :note="note"
          :allTags="tags"
          @edit="editNote"
          @delete="deleteNote"
          @trash="moveNoteToTrash"
          @toggle-done="toggleNoteDoneStatus"
          @click="viewNote(note)"
        />
      </div>
    </section>
    
    <!-- Search Results Section -->
    <section class="section" v-if="isSearchActive">
      <div class="section-header">
        <div class="search-results-header">
          <h2 class="section-title">
            Found {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}
          </h2>
          <button class="clear-search-button" @click="clearSearch">
            <i class="bi bi-x-circle"></i> Clear Search
          </button>
        </div>
      </div>
      
      <div class="notes-grid" v-if="searchResults.length > 0">
        <NoteCard 
          v-for="note in searchResults" 
          :key="note._id"
          :note="note"
          :allTags="tags"
          @edit="editNote"
          @delete="deleteNote"
          @trash="moveNoteToTrash"
          @toggle-done="toggleNoteDoneStatus"
          @click="viewNote(note)"
        />
      </div>
      
      <div class="no-results" v-else>
        No notes found matching your search.
      </div>
    </section>
    
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
          <div class="note-view-tags" v-if="viewingNoteTags.length > 0">
            <TagBadge v-for="tag in viewingNoteTags" :key="tag._id" :tag="tag" />
          </div>
          <div class="note-view-text">
            {{ viewingNote.content }}
          </div>
          <div class="note-view-meta">
            <div class="meta-info">
              <div>
                Created: {{ formatVietnameseDatetime(viewingNote.createdAt) }}
              </div>
              <div v-if="viewingNote.updatedAt && isNoteUpdated(viewingNote)">
                Updated: {{ formatVietnameseDatetime(viewingNote.updatedAt) }}
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
import { ref, computed, onMounted, watch } from 'vue'
import { getNotes, createNote, updateNote, deleteNote as apiDeleteNote, moveToTrash, getTags, getUserId, toggleNoteDone, searchNotes } from '../helpers/api'
import { formatDate, formatVietnameseDatetime } from '../helpers/utils'
import NoteCard from '../components/NoteCard.vue'
import NoteForm from '../components/NoteForm.vue'
import TagBadge from '../components/TagBadge.vue'
import Swal from 'sweetalert2'

export default {
  name: 'Home',
  components: {
    NoteCard,
    NoteForm,
    TagBadge
  },
  emits: ['note-created', 'note-updated', 'note-deleted', 'tag-created', 'tag-updated'],
  setup(props, { emit }) {
    // User ID (would come from auth in real app)
    const userId = ref(getUserId())
    
    // Note tabs
    const currentNoteTab = ref('today')
    const noteTabs = [
      { id: 'today', name: 'Todays' },
      { id: 'week', name: 'This Week' },
      { id: 'month', name: 'This Month' }
    ]
    
    // Search functionality
    const searchQuery = ref('')
    const searchResults = ref([])
    const isSearchActive = ref(false)
    const searchDebounceTimeout = ref(null)
    
    // Perform search as user types
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
          const response = await searchNotes(searchQuery.value, userId.value)
          searchResults.value = response.data
        } catch (err) {
          console.error('Error performing search:', err)
          searchResults.value = []
          showErrorAlert('Error searching notes. Please try again.')
        }
      }, 300) // 300ms debounce
    }
    
    // Clear search
    const clearSearch = () => {
      searchQuery.value = ''
      searchResults.value = []
      isSearchActive.value = false
    }
    
    // Truncate content for preview
    const truncateContent = (content) => {
      if (!content) return ''
      return content.length > 60 ? content.substring(0, 60) + '...' : content
    }
    
    // Sort options
    const showSortDropdown = ref(false)
    const currentSortOption = ref('newest')
    const sortOptions = [
      { id: 'newest', name: 'Newest First' },
      { id: 'oldest', name: 'Oldest First' },
      { id: 'done', name: 'Done' },
      { id: 'undone', name: 'Undone' }
    ]
    
    const toggleSortDropdown = () => {
      showSortDropdown.value = !showSortDropdown.value
    }
    
    const selectSortOption = (optionId) => {
      currentSortOption.value = optionId
      showSortDropdown.value = false
    }
    
    // Close dropdown when clicking outside
    const handleOutsideClick = (event) => {
      // Handle sort dropdown
      const sortDropdown = document.querySelector('.sort-dropdown-container')
      if (sortDropdown && !sortDropdown.contains(event.target)) {
        showSortDropdown.value = false
      }
    }
    
    onMounted(() => {
      fetchNotes();
      fetchTags();
      
      // Setup global event listeners
      const cleanup = listenForGlobalEvents()
      
      // Add click outside listener
      document.addEventListener('click', handleOutsideClick)
      
      // Return cleanup function for onUnmounted
      return () => {
        cleanup()
        document.removeEventListener('click', handleOutsideClick)
      }
    })
    
    // Show success notification
    const showSuccessAlert = (message) => {
      console.log("SUCCESS:", message);
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
      });
    }
    
    // Show error notification
    const showErrorAlert = (message) => {
      console.log("ERROR:", message);
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
      });
    }
    
    // Notes and tags data
    const notes = ref([])
    const tags = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    
    // Form handling
    const showNoteForm = ref(false)
    const currentNote = ref({})
    
    // View note
    const showNoteView = ref(false)
    const viewingNote = ref({})
    const viewingNoteTags = computed(() => {
      // If there are no tags in the note or no tags fetched, return empty array
      if (!viewingNote.value.tags || !Array.isArray(viewingNote.value.tags) || !tags.value || !tags.value.length) {
        return []
      }
      
      // Ensure we're working with tag IDs as strings for consistent comparison
      const noteTagIds = viewingNote.value.tags.map(tag => 
        typeof tag === 'object' ? tag._id : String(tag)
      )
      
      // Match each tag in allTags if its ID is in the note's tags array
      return tags.value.filter(tag => 
        noteTagIds.includes(tag._id) || noteTagIds.includes(String(tag._id))
      )
    })
    
    // Current month for display
    const currentMonth = computed(() => {
      const now = new Date();
      return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    });
    
    // Filter notes based on current tab
    const filteredNotes = computed(() => {
      if (notes.value.length === 0) return []
      
      const today = new Date()
      const oneWeekAgo = new Date(today)
      oneWeekAgo.setDate(today.getDate() - 7)
      const oneMonthAgo = new Date(today)
      oneMonthAgo.setMonth(today.getMonth() - 1)
      
      let filtered = []
      
      // First filter by tab (date range)
      switch (currentNoteTab.value) {
        case 'today':
          filtered = notes.value.filter(note => {
            const noteDate = new Date(note.createdAt)
            return noteDate.toDateString() === today.toDateString()
          })
          break
        case 'week':
          filtered = notes.value.filter(note => {
            const noteDate = new Date(note.createdAt)
            return noteDate >= oneWeekAgo
          })
          break
        case 'month':
          filtered = notes.value.filter(note => {
            const noteDate = new Date(note.createdAt)
            return noteDate >= oneMonthAgo
          })
          break
        default:
          filtered = [...notes.value]
          break
      }
      
      // Then apply sort/filter option
      switch (currentSortOption.value) {
        case 'newest':
          return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        case 'oldest':
          return filtered.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
        case 'done':
          return filtered.filter(note => note.done).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        case 'undone':
          return filtered.filter(note => !note.done).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        default:
          return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      }
    })

    // All notes for the Totals section
    const allNotes = computed(() => {
      if (notes.value.length === 0) return [];
      
      // Apply sort/filter options
      switch (currentSortOption.value) {
        case 'newest':
          return [...notes.value].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        case 'oldest':
          return [...notes.value].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        case 'done':
          return [...notes.value].filter(note => note.done).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        case 'undone':
          return [...notes.value].filter(note => !note.done).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        default:
          return [...notes.value].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }
    });
    
    // Fetch notes from API
    const fetchNotes = async () => {
      try {
        isLoading.value = true;
        error.value = null;
        const response = await getNotes(userId.value)
        notes.value = response.data || []
        isLoading.value = false;
      } catch (err) {
        console.error('Error fetching notes:', err)
        error.value = 'Failed to load notes'
        isLoading.value = false;
        showErrorAlert('Failed to load notes');
      }
    }
    
    // Fetch tags from API
    const fetchTags = async () => {
      try {
        const response = await getTags(userId.value)
        tags.value = response.data || []
        console.log('Fetched tags:', tags.value)
      } catch (err) {
        console.error('Error fetching tags:', err)
        showErrorAlert('Failed to load tags');
      }
    }
    
    // Create or update a note
    const saveNote = async (noteData) => {
      try {
        isLoading.value = true;
        error.value = null;
        
        // Tạo bản sao để tránh tác động đến dữ liệu gốc
        const sanitizedData = { ...noteData };
        
        if (sanitizedData._id) {
          // Update existing note
          const noteId = sanitizedData._id;
          
          // Tạo bản sao không có _id
          const { _id, ...updateData } = sanitizedData;
          
          // Đảm bảo tags luôn là mảng các ID dạng chuỗi
          if (Array.isArray(updateData.tags)) {
            updateData.tags = updateData.tags.map(tag => 
              typeof tag === 'object' ? tag._id : String(tag)
            );
          }
          
          try {
            // Gửi request cập nhật
            const response = await updateNote(noteId, updateData);
            
            // Cập nhật trong mảng notes
            if (response && response.data) {
              const index = notes.value.findIndex(n => n._id === noteId);
              if (index !== -1) {
                notes.value[index] = response.data;
              }
              
              // Cập nhật trong searchResults nếu đang tìm kiếm
              if (isSearchActive.value) {
                const searchIndex = searchResults.value.findIndex(n => n._id === noteId);
                if (searchIndex !== -1) {
                  // Kiểm tra xem note đã update có còn khớp với kết quả tìm kiếm không
                  if (response.data.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                      response.data.content.toLowerCase().includes(searchQuery.value.toLowerCase())) {
                    searchResults.value[searchIndex] = response.data;
                  } else {
                    // Nếu không còn khớp, xóa khỏi kết quả tìm kiếm
                    searchResults.value.splice(searchIndex, 1);
                  }
                }
              }
              
              // Thông báo thành công
              showSuccessAlert('Note updated successfully!');
              
              // Đóng form
              closeNoteForm();
              
              // Làm mới dữ liệu
              await fetchNotes();
              await fetchTags();
              
              // Gửi sự kiện
              emit('note-updated', response.data);
            } else {
              throw new Error('Invalid response from server');
            }
          } catch (updateError) {
            console.error('Error updating note:', updateError);
            showErrorAlert('Failed to update note. However, your changes have been saved locally.');
          }
        } else {
          // Create new note
          const createData = {
            ...sanitizedData,
            userId: userId.value
          };
          
          // Đảm bảo tags luôn là mảng các ID dạng chuỗi
          if (Array.isArray(createData.tags)) {
            createData.tags = createData.tags.map(tag => 
              typeof tag === 'object' ? tag._id : String(tag)
            );
          }
          
          try {
            // Gửi request tạo mới
            const response = await createNote(createData);
            
            if (response && response.data) {
              // Thêm vào mảng notes
              notes.value.unshift(response.data);
              
              // Thông báo thành công
              showSuccessAlert('Note created successfully!');
              
              // Đóng form
              closeNoteForm();
              
              // Làm mới dữ liệu
              await fetchNotes();
              await fetchTags();
              
              // Gửi sự kiện
              emit('note-created', response.data);
            } else {
              throw new Error('Invalid response from server');
            }
          } catch (createError) {
            console.error('Error creating note:', createError);
            showErrorAlert('Failed to create note. Please try again or check your connection.');
          }
        }
        
        isLoading.value = false;
      } catch (err) {
        console.error('General error in saveNote:', err);
        isLoading.value = false;
        // Không đóng form khi có lỗi chung
      }
    }
    
    // Delete a note (now used for permanent deletion)
    const deleteNote = async (noteId) => {
      try {
        isLoading.value = true;
        error.value = null;
        
        await apiDeleteNote(noteId);
        
        // Remove from local notes array
        notes.value = notes.value.filter(n => n._id !== noteId);
        
        // Remove from search results if found
        if (isSearchActive.value) {
          searchResults.value = searchResults.value.filter(n => n._id !== noteId);
        }
        
        isLoading.value = false;
        showSuccessAlert('Note deleted successfully!');
        
        // Refresh notes and tags
        await Promise.all([fetchNotes(), fetchTags()]);
        
        // Emit delete event
        emit('note-deleted', noteId);
      } catch (err) {
        console.error('Error deleting note:', err);
        error.value = 'Failed to delete note';
        isLoading.value = false;
        showErrorAlert('Failed to delete note. Please try again.');
      }
    }
    
    // Move a note to trash (soft delete)
    const moveNoteToTrash = async (noteId) => {
      try {
        isLoading.value = true;
        error.value = null;
        
        await moveToTrash(noteId);
        
        // Remove from local notes array
        notes.value = notes.value.filter(n => n._id !== noteId);
        
        // Remove from search results if found
        if (isSearchActive.value) {
          searchResults.value = searchResults.value.filter(n => n._id !== noteId);
        }
        
        isLoading.value = false;
        showSuccessAlert('Note moved to trash successfully!');
        
        // Refresh notes and tags
        await Promise.all([fetchNotes(), fetchTags()]);
        
        // Emit event
        emit('note-deleted', noteId);
      } catch (err) {
        console.error('Error moving note to trash:', err);
        error.value = 'Failed to move note to trash';
        isLoading.value = false;
        showErrorAlert('Failed to move note to trash. Please try again.');
      }
    }
    
    // Open form to create new note
    const openNewNoteForm = () => {
      currentNote.value = {
        title: '',
        content: '',
        tags: [],
        done: false
      };
      showNoteForm.value = true;
    }
    
    // Open form to edit existing note
    const editNote = (note) => {
      // Make a deep copy and ensure tags are IDs
      currentNote.value = JSON.parse(JSON.stringify(note));
      
      // Ensure tags are always IDs
      if (Array.isArray(currentNote.value.tags)) {
        currentNote.value.tags = currentNote.value.tags.map(tag => 
          typeof tag === 'object' ? tag._id : tag
        );
      }
      
      showNoteForm.value = true;
      
      // Close the view if it's open
      if (showNoteView.value) {
        showNoteView.value = false;
      }
    }
    
    // Close the note form
    const closeNoteForm = () => {
      showNoteForm.value = false;
      currentNote.value = {};
    }
    
    // View a note's full content
    const viewNote = (note) => {
      viewingNote.value = { ...note };
      showNoteView.value = true;
    }
    
    // Close note view
    const closeNoteView = () => {
      showNoteView.value = false;
      viewingNote.value = {};
    }

    // Helper to check if note was updated
    const isNoteUpdated = (note) => {
      if (!note.createdAt || !note.updatedAt) return false;
      const createdAt = new Date(note.createdAt);
      const updatedAt = new Date(note.updatedAt);
      return updatedAt.getTime() > createdAt.getTime();
    };

    // Toggle note done status
    const toggleNoteDoneStatus = async (note) => {
      try {
        isLoading.value = true
        error.value = null
        
        const newDoneStatus = !note.done
        
        await toggleNoteDone(note._id, newDoneStatus)
        
        // Update the note in the local array
        const index = notes.value.findIndex(n => n._id === note._id)
        if (index !== -1) {
          notes.value[index].done = newDoneStatus
        }
        
        // Update the note in search results if found
        if (isSearchActive.value) {
          const searchIndex = searchResults.value.findIndex(n => n._id === note._id)
          if (searchIndex !== -1) {
            searchResults.value[searchIndex].done = newDoneStatus
          }
        }
        
        showSuccessAlert(`Note marked as ${newDoneStatus ? 'done' : 'undone'}!`)
        isLoading.value = false
      } catch (err) {
        console.error('Error toggling note status:', err)
        error.value = 'Failed to update note status'
        isLoading.value = false
        showErrorAlert('Failed to update note status. Please try again.')
      }
    }

    // Toggle done status of the viewing note
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
        
        // Update the note in search results if found
        if (isSearchActive.value) {
          const searchIndex = searchResults.value.findIndex(n => n._id === viewingNote.value._id)
          if (searchIndex !== -1) {
            searchResults.value[searchIndex].done = newDoneStatus
          }
        }
        
        showSuccessAlert(`Note marked as ${newDoneStatus ? 'done' : 'undone'}!`)
      } catch (err) {
        console.error('Error toggling note status:', err)
        showErrorAlert('Failed to update note status. Please try again.')
      }
    }
    
    // Listen for global events to open the note form
    const listenForGlobalEvents = () => {
      window.addEventListener('open-note-form', openNewNoteForm)
      
      // Cleanup listener on unmount
      return () => {
        window.removeEventListener('open-note-form', openNewNoteForm)
      }
    }
    
    return {
      userId,
      currentNoteTab,
      noteTabs,
      notes,
      tags,
      currentMonth,
      filteredNotes,
      isLoading,
      error,
      showNoteForm,
      currentNote,
      showNoteView,
      viewingNote,
      viewingNoteTags,
      formatDate,
      formatVietnameseDatetime,
      openNewNoteForm,
      editNote,
      deleteNote,
      saveNote,
      closeNoteForm,
      viewNote,
      closeNoteView,
      isNoteUpdated,
      moveNoteToTrash,
      toggleNoteDoneStatus,
      toggleViewingNoteDone,
      allNotes, // Expose allNotes for the Totals section
      showSortDropdown,
      currentSortOption,
      sortOptions,
      toggleSortDropdown,
      selectSortOption,
      searchQuery,
      searchResults,
      isSearchActive,
      performSearch,
      clearSearch,
      truncateContent
    }
  }
}
</script>

<style scoped>
.home {
  padding-bottom: 30px;
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

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.date-navigation {
  display: flex;
  align-items: center;
}

.nav-button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.current-date {
  margin: 0 10px;
  font-size: 14px;
  color: var(--secondary);
}

.tabs {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
  justify-content: space-between;
}

.tab-button {
  padding: 10px 16px;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  color: var(--secondary);
}

.tab-button.active {
  border-bottom: 2px solid var(--accent);
  color: var(--primary);
  font-weight: 500;
}

.sort-dropdown-container {
  position: relative;
  margin-left: auto;
}

.sort-button {
  padding: 8px 12px;
  font-size: 14px;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: navy;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.sort-button:hover {
  background-color: rgba(0, 0, 128, 0.1);
}

.sort-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  width: 180px;
  background-color: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  padding: 8px 0;
}

.sort-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-option:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.radio-button {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-radius: 50%;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: transparent;
  transition: all 0.2s;
}

.radio-inner.active {
  background-color: var(--accent);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.new-note {
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
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

.section-divider {
  height: 1px;
  background-color: var(--border);
  margin: 20px 0;
}

/* Search styles */
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

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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
  margin-left: 16px;
}

.clear-search-button:hover {
  background-color: #c82333;
}

.no-results {
  text-align: center;
  color: var(--secondary);
  padding: 20px 0;
  font-size: 16px;
}

@media screen and (max-width: 768px) {
  .notes-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .tabs {
    overflow-x: auto;
  }
  
  .tab-button {
    white-space: nowrap;
  }
}
</style> 
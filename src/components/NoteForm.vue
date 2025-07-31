<template>
  <div class="note-form-wrapper">
    <div class="note-form-overlay">
      <div class="note-form-container">
        <div class="note-form-header">
          <h3>{{ isEditing ? 'Edit Note' : 'Create New Note' }}</h3>
          <button class="close-button" @click="cancel">&times;</button>
        </div>
        <form @submit.prevent="submitForm" class="note-form">
          <div class="form-group">
            <label for="title">Title</label>
            <input 
              type="text" 
              id="title" 
              v-model="formData.title" 
              placeholder="Note title"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="content">Content</label>
            <textarea 
              id="content" 
              v-model="formData.content" 
              placeholder="Note content"
              rows="6"
              required
            ></textarea>
          </div>
          
          <div class="form-group">
            <div class="tags-header">
              <label>Tags</label>
              <button type="button" class="add-tag-btn" @click="showTagForm = true">+ New Tag</button>
            </div>
            <div class="tags-selector">
              <div v-if="isLoading" class="loading-tags">
                <span>Loading tags...</span>
              </div>
              <div v-else-if="tags.length === 0" class="no-tags">
                No tags available. Create a tag to categorize your notes.
              </div>
              <div 
                v-else
                v-for="tag in tags" 
                :key="tag._id" 
                :class="['tag-option', { selected: isTagSelected(tag._id) }]"
                @click="toggleTag(tag._id)"
              >
                <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
                <span class="tag-name">{{ tag.name }}</span>
              </div>
            </div>
          </div>

          <!-- Only show "Mark as done" when editing, not when creating -->
          <div class="form-group" v-if="isEditing">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.done" />
              <span class="checkbox-text">Mark as done</span>
            </label>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="cancel">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="!isFormValid">{{ isEditing ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Tag Form Modal (nested) -->
    <TagForm
      v-if="showTagForm"
      :tag="{ name: '', color: generateRandomColor() }"
      :userId="userId"
      @submit="handleTagCreated"
      @cancel="showTagForm = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { getTags, createTag } from '../helpers/api'
import { generateRandomColor } from '../helpers/utils'
import TagForm from './TagForm.vue'
import Swal from 'sweetalert2'

export default {
  name: 'NoteForm',
  components: {
    TagForm
  },
  props: {
    note: {
      type: Object,
      default: () => ({
        title: '',
        content: '',
        tags: [],
        done: false
      })
    },
    userId: {
      type: String,
      required: true
    }
  },
  emits: ['submit', 'cancel', 'tag-created'],
  setup(props, { emit }) {
    // State management
    const tags = ref([])
    const isLoading = ref(false)
    const showTagForm = ref(false)
    const isEditing = computed(() => !!props.note._id)
    
    /**
     * Create reactive form data and ensure tags is always an array of IDs
     * Handles both tag objects and tag ID strings consistently
     */
    const formData = reactive({
      title: props.note.title || '',
      content: props.note.content || '',
      tags: Array.isArray(props.note.tags) 
        ? props.note.tags.map(tag => typeof tag === 'object' ? tag._id : tag) 
        : [],
      done: props.note.done || false,
      userId: props.userId
    })
    
    /**
     * Form validation to ensure required fields are filled
     */
    const isFormValid = computed(() => {
      return formData.title.trim() !== '' && formData.content.trim() !== '';
    })
    
    /**
     * Display a success toast notification
     * @param {string} message - The success message to display
     */
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
    
    /**
     * Fetch all available tags for the current user
     */
    const fetchTags = async () => {
      try {
        isLoading.value = true
        const response = await getTags(props.userId)
        tags.value = response.data || []
        isLoading.value = false
      } catch (err) {
        console.error('Error fetching tags:', err)
        isLoading.value = false
      }
    }
    
    /**
     * Check if a specific tag is selected in the current form
     * @param {string} tagId - The ID of the tag to check
     * @returns {boolean} - Whether the tag is selected
     */
    const isTagSelected = (tagId) => {
      if (!formData.tags || !Array.isArray(formData.tags)) return false
      const stringTagId = String(tagId)
      return formData.tags.some(id => 
        String(id) === stringTagId || (typeof id === 'object' && String(id._id) === stringTagId)
      )
    }
    
    /**
     * Toggle the selection state of a tag
     * @param {string} tagId - The ID of the tag to toggle
     */
    const toggleTag = (tagId) => {
      const stringTagId = String(tagId)
      if (isTagSelected(stringTagId)) {
        formData.tags = formData.tags.filter(id => 
          String(id) !== stringTagId && 
          (typeof id !== 'object' || String(id._id) !== stringTagId)
        )
      } else {
        formData.tags.push(stringTagId)
      }
    }
    
    /**
     * Handle newly created tags
     * Creates the tag via API, adds it to the list, and selects it
     * @param {Object} tagData - The tag data to create
     */
    const handleTagCreated = async (tagData) => {
      try {
        const response = await createTag(tagData)
        
        if (response.data) {
          // Add new tag to list
          tags.value.push(response.data)
          
          // Auto-select the new tag
          toggleTag(response.data._id)
          
          // Show success message
          showSuccessAlert(`Tag "${response.data.name}" created and added to note!`)
          
          // Emit event for parent components
          emit('tag-created', response.data)
        }
        
        showTagForm.value = false
      } catch (err) {
        console.error('Error creating tag:', err)
        Swal.fire({
          title: 'Error!',
          text: 'Failed to create tag. Please try again.',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
      }
    }
    
    /**
     * Submit the form data to parent component
     * Sanitizes and validates data before submission
     */
    const submitForm = () => {
      if (!isFormValid.value) return;
      
      console.log("Form data being submitted:", formData);
      
      try {
        // Ensure tags are always sent as array of string IDs
        const sanitizedData = {
          ...formData,
          tags: formData.tags.map(tag => typeof tag === 'object' ? tag._id : tag),
          _id: props.note._id // Include note ID if editing
        };
        
        // Send data to parent component to handle API
        emit('submit', sanitizedData);
        
        // Note: Form will be closed by parent component (Home.vue) after successful API call
      } catch (err) {
        console.error("Error preparing form data:", err);
      }
    }
    
    /**
     * Handle form cancellation with unsaved changes confirmation
     * Prompts user to confirm if there are unsaved changes
     */
    const cancel = () => {
      // Show confirmation dialog if user has modified the form
      const hasChanges = 
        formData.title !== (props.note.title || '') ||
        formData.content !== (props.note.content || '') ||
        JSON.stringify(formData.tags) !== JSON.stringify(props.note.tags || []) ||
        formData.done !== (props.note.done || false);
      
      if (hasChanges) {
        Swal.fire({
          title: 'Discard changes?',
          text: 'You have unsaved changes. Are you sure you want to discard them?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, discard',
          cancelButtonText: 'No, keep editing'
        }).then((result) => {
          if (result.isConfirmed) {
            emit('cancel');
          }
        });
      } else {
        emit('cancel');
      }
    }
    
    // Load tags when component mounts
    onMounted(() => {
      fetchTags()
    })
    
    return {
      tags,
      isLoading,
      showTagForm,
      formData,
      isEditing,
      isFormValid,
      isTagSelected,
      toggleTag,
      submitForm,
      cancel,
      handleTagCreated,
      generateRandomColor
    }
  }
}
</script>

<style scoped>
/* Modal overlay - this covers the entire screen */
.note-form-wrapper,
.note-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Form container */
.note-form-container {
  background-color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

/* Form header */
.note-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.note-form-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

/* Main form styling */
.note-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

/* Checkbox styling */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-text {
  margin-left: 8px;
}

/* Tags section styling */
.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.add-tag-btn {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background-color: var(--accent-light);
  color: var(--accent);
  border: 1px solid var(--accent);
}

.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background-color: var(--background-alt);
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.tag-option {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background-color: white;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option.selected {
  background-color: var(--accent-light);
  border-color: var(--accent);
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.loading-tags, .no-tags {
  width: 100%;
  padding: 12px;
  text-align: center;
  color: var(--secondary);
  font-style: italic;
}

/* Form input styling */
input[type="text"], textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
}

textarea {
  resize: vertical;
}

/* Form action buttons */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn, .submit-btn {
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background: none;
  border: 1px solid var(--border);
}

.submit-btn {
  background-color: var(--accent);
  color: white;
  border: none;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 
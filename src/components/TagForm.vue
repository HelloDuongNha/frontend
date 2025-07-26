<template>
  <div class="tag-form-overlay">
    <div class="tag-form-container">
      <div class="tag-form-header">
        <h3>{{ isEditing ? 'Edit Tag' : 'Create New Tag' }}</h3>
        <button class="close-button" @click="cancel">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <form @submit.prevent="submitForm" class="tag-form">
        <!-- Tag Name -->
        <div class="form-group">
          <label for="tagName">Tag Name</label>
          <input 
            type="text" 
            id="tagName" 
            v-model="formData.name" 
            placeholder="Enter tag name"
            class="form-control"
            required
            @input="checkForDuplicateName"
          />
          <div v-if="duplicateTagError" class="error-message">
            This tag name already exists. Please use a different name.
          </div>
        </div>
        
        <!-- Tag Color -->
        <div class="form-group">
          <label>Tag Color</label>
          <div class="color-picker-container">
            <!-- Color Picker -->
            <div class="color-picker-wrapper">
              <Chrome v-model="colorPickerValue" @update:modelValue="updateColor" :disableAlpha="true" />
            </div>
            
            <!-- Hex Input Field -->
            <div class="hex-input-container">
              <label for="hexColor">Hex Color</label>
              <div class="input-with-preview">
                <input 
                  type="text" 
                  id="hexColor"
                  v-model="formData.color"
                  @input="updateFromHexInput"
                  placeholder="#RRGGBB"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  class="form-control"
                  required
                />
                <div class="color-preview" :style="{ backgroundColor: formData.color }"></div>
              </div>
            </div>
            
            <!-- Predefined Color Options -->
            <div class="color-options">
              <button
                type="button"
                v-for="color in colorOptions"
                :key="color"
                :class="['color-option', { selected: formData.color === color }]"
                :style="{ backgroundColor: color }"
                @click="selectColor(color)"
              ></button>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn cancel-btn" @click="cancel">Cancel</button>
          <button type="submit" class="btn submit-btn" :disabled="!isFormValid || duplicateTagError">
            {{ isEditing ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch, inject } from 'vue'
import { Chrome } from '@ckpack/vue-color'
import { generateRandomColor } from '../helpers/utils'
import { getTags } from '../helpers/api'

export default {
  name: 'TagForm',
  components: {
    Chrome
  },
  props: {
    tag: {
      type: Object,
      default: () => ({
        name: '',
        color: generateRandomColor()
      })
    },
    userId: {
      type: String,
      required: true
    },
    existingTags: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    // Determine if editing or creating
    const isEditing = computed(() => !!props.tag._id)
    
    // Form data
    const formData = reactive({
      name: props.tag.name || '',
      color: props.tag.color || generateRandomColor(),
      userId: props.userId
    })
    
    // Color picker object value
    const colorPickerValue = ref({
      hex: formData.color,
      rgba: { r: 0, g: 0, b: 0, a: 1 }
    })
    
    // Store all existing tags and duplicate check
    const allTags = ref(props.existingTags || [])
    const duplicateTagError = ref(false)
    
    // Fetch existing tags if not provided
    const fetchExistingTags = async () => {
      try {
        if (props.existingTags.length === 0) {
          const response = await getTags(props.userId)
          allTags.value = response.data || []
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    
    // Check for duplicate tag name
    const checkForDuplicateName = () => {
      if (!formData.name.trim()) {
        duplicateTagError.value = false
        return
      }
      
      // Skip current tag when editing
      const otherTags = isEditing.value 
        ? allTags.value.filter(tag => tag._id !== props.tag._id) 
        : allTags.value
      
      const normalizedName = formData.name.trim().toLowerCase()
      duplicateTagError.value = otherTags.some(tag => 
        tag.name.toLowerCase() === normalizedName
      )
    }
    
    // Predefined color options
    const colorOptions = [
      '#FF6B6B', // red
      '#FF9E7A', // orange
      '#FFCC5C', // yellow
      '#88D8B0', // green
      '#7FDBDA', // teal
      '#98C1FF', // blue
      '#C3A6FF', // purple
      '#FF9CC2', // pink
      '#BCBCBC', // gray
    ]
    
    // Form validation
    const isFormValid = computed(() => {
      return formData.name.trim() !== '' && 
        /^#[0-9A-Fa-f]{6}$/.test(formData.color)
    })
    
    // Initialize color picker with the current color
    const initializeColorPicker = () => {
      const hex = formData.color
      
      // Parse the hex color to RGB
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      
      colorPickerValue.value = {
        hex: hex,
        rgba: { r, g, b, a: 1 }
      }
    }
    
    // Update form color when color picker changes
    const updateColor = (color) => {
      formData.color = color.hex
    }
    
    // Update color picker when hex input changes
    const updateFromHexInput = () => {
      // Validate hex format
      if (/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
        const hex = formData.color
        
        // Parse the hex color to RGB
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        
        colorPickerValue.value = {
          hex: hex,
          rgba: { r, g, b, a: 1 }
        }
      }
    }
    
    // Select a predefined color
    const selectColor = (color) => {
      formData.color = color
      updateFromHexInput()
    }
    
    // Submit the form
    const submitForm = () => {
      if (!isFormValid.value || duplicateTagError.value) return
      
      emit('submit', { 
        ...formData,
        _id: props.tag._id // Include tag ID if editing
      })
    }
    
    // Cancel and close the form
    const cancel = () => {
      emit('cancel')
    }
    
    // Initialize on mount
    onMounted(() => {
      initializeColorPicker()
      fetchExistingTags()
      checkForDuplicateName()
    })
    
    // Watch for name changes to check duplicates
    watch(() => formData.name, checkForDuplicateName)
    
    return {
      formData,
      colorPickerValue,
      colorOptions,
      isEditing,
      isFormValid,
      duplicateTagError,
      updateColor,
      updateFromHexInput,
      selectColor,
      checkForDuplicateName,
      submitForm,
      cancel
    }
  }
}
</script>

<style scoped>
.tag-form-overlay {
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

.tag-form-container {
  background-color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.tag-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.tag-form-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--secondary);
}

.tag-form {
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

.form-control {
  display: block;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.error-message {
  color: #dc3545;
  font-size: 13px;
  margin-top: 5px;
}

.color-picker-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.color-picker-wrapper {
  display: flex;
  justify-content: center;
}

.hex-input-container {
  width: 100%;
}

.input-with-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.color-option {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.color-option.selected {
  transform: scale(1.2);
  box-shadow: 0 0 0 2px var(--accent);
}

.color-option:hover:not(.selected) {
  transform: scale(1.1);
  box-shadow: 0 0 0 1px var(--border);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background-color: transparent;
  color: var(--secondary);
  border: 1px solid var(--border);
}

.submit-btn {
  background-color: var(--accent);
  color: white;
  border: none;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .tag-form-container {
    width: 95%;
  }
}
</style> 
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit User</h2>
        <button class="modal-close" @click="closeModal">&times;</button>
      </div>
      
      <!-- Current user role badge -->
      <div class="user-role">
        <span v-if="user.role === 'admin'" class="badge-admin">Admin</span>
        <span v-else-if="user.role === 'user'" class="badge-user">User</span>
      </div>
      
      <div class="modal-body">
        <!-- User Information Section -->
        <div class="form-section">
          <div class="input-block name-input-row">
            <div class="name-field">
              <label for="user-name">Name</label>
              <input 
                id="user-name" 
                type="text" 
                v-model="userName"
                @input="nameChanged = true"
              >
            </div>
            <button 
              class="save-button"
              :class="{ 'active': nameChanged }"
              :disabled="!nameChanged || !userName.trim() || isNameChangeProcessing"
              @click="updateUserName"
            >
              <span v-if="!isNameChangeProcessing">Save</span>
              <span v-else class="loading-container">
                <span class="loading-spinner"></span>
              </span>
            </button>
          </div>
          
          <div class="input-block email-input-row">
            <div class="email-field">
              <label for="user-email">Email</label>
              <div class="email-input-container">
                <input 
                  id="user-email" 
                  type="email" 
                  v-model="userEmail"
                  @input="emailChanged = true"
                >
              </div>
            </div>
            <button 
              class="save-button email-save-button"
              :class="{ 'active': emailChanged }"
              :disabled="!emailChanged || !isValidEmail || isEmailChangeProcessing"
              @click="updateUserEmail"
            >
              <span v-if="!isEmailChangeProcessing">Save</span>
              <span v-else class="loading-container">
                <span class="loading-spinner"></span>
              </span>
            </button>
          </div>
        </div>
        
        <!-- Reset Password Section -->
        <div class="form-section password-section">
          <h3>Reset Password</h3>
          
          <div class="input-block">
            <label for="new-password">New Password</label>
            <input 
              id="new-password" 
              type="password" 
              v-model="newPassword"
              placeholder="Enter new password"
            >
          </div>
          
          <div class="input-block">
            <label for="confirm-password">Confirm New Password</label>
            <input 
              id="confirm-password" 
              type="password" 
              v-model="confirmPassword"
              placeholder="Confirm new password"
            >
          </div>
          
          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>
          
          <button 
            class="password-button"
            :disabled="!canResetPassword || isPasswordResetProcessing"
            @click="resetUserPassword"
          >
            <span v-if="!isPasswordResetProcessing">Reset Password</span>
            <span v-else class="loading-dots">
              Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { updateUserAdmin } from '../helpers/api'
import Swal from 'sweetalert2'

export default {
  name: 'UserEditModal',
  props: {
    // User object to edit
    user: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'update'],
  setup(props, { emit }) {
    // User information
    const userName = ref(props.user.name || '')
    const userEmail = ref(props.user.email || '')
    
    // Change flags
    const nameChanged = ref(false)
    const emailChanged = ref(false)
    
    // Loading states
    const isNameChangeProcessing = ref(false)
    const isEmailChangeProcessing = ref(false)
    
    // Password reset
    const newPassword = ref('')
    const confirmPassword = ref('')
    const passwordError = ref('')
    const isPasswordResetProcessing = ref(false)
    
    // Email validation
    const isValidEmail = computed(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(userEmail.value)
    })
    
    // Password validation
    const canResetPassword = computed(() => {
      return newPassword.value && 
             confirmPassword.value && 
             newPassword.value === confirmPassword.value &&
             newPassword.value.length >= 6
    })
    
    // Initialize with user data from props
    onMounted(() => {
      userName.value = props.user.name || ''
      userEmail.value = props.user.email || ''
      
      // Reset change flags
      nameChanged.value = false
      emailChanged.value = false
    })
    
    // Close modal
    const closeModal = () => {
      emit('close')
    }
    
    // Show success alert
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
    
    // Show error alert
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
    
    // Update user name only
    const updateUserName = async () => {
      try {
        isNameChangeProcessing.value = true
        
        const adminName = localStorage.getItem('userName') || 'Administrator'
        const result = await updateUserAdmin(
          props.user._id, 
          { name: userName.value },
          { adminName }
        )
        
        if (result.success) {
          nameChanged.value = false
          showSuccessAlert('User name updated successfully!')
          emit('update', { ...props.user, name: userName.value })
        } else {
          throw new Error(result.error || 'Failed to update name')
        }
      } catch (err) {
        console.error('Error updating user name:', err)
        showErrorAlert('Failed to update name. Please try again.')
      } finally {
        isNameChangeProcessing.value = false
      }
    }
    
    // Update user email only
    const updateUserEmail = async () => {
      try {
        if (!isValidEmail.value) {
          showErrorAlert('Please enter a valid email address.')
          return
        }
        
        isEmailChangeProcessing.value = true
        
        const adminName = localStorage.getItem('userName') || 'Administrator'
        const result = await updateUserAdmin(
          props.user._id, 
          { email: userEmail.value },
          { adminName }
        )
        
        if (result.success) {
          emailChanged.value = false
          showSuccessAlert('User email updated successfully!')
          emit('update', { ...props.user, email: userEmail.value })
        } else {
          throw new Error(result.error || 'Failed to update email')
        }
      } catch (err) {
        console.error('Error updating user email:', err)
        showErrorAlert(err.message || 'Failed to update email. Please try again.')
      } finally {
        isEmailChangeProcessing.value = false
      }
    }
    
    // Reset user password
    const resetUserPassword = async () => {
      passwordError.value = ''
      
      if (!canResetPassword.value) {
        passwordError.value = 'Please fill all fields correctly'
        return
      }
      
      try {
        isPasswordResetProcessing.value = true
        
        const adminName = localStorage.getItem('userName') || 'Administrator'
        const result = await updateUserAdmin(
          props.user._id, 
          { password: newPassword.value },
          { adminName }
        )
        
        if (result.success) {
          showSuccessAlert('Password reset successfully!')
          
          // Reset password fields
          newPassword.value = ''
          confirmPassword.value = ''
          
          emit('update', props.user)
        } else {
          throw new Error(result.error || 'Failed to reset password')
        }
      } catch (err) {
        console.error('Error resetting password:', err)
        passwordError.value = 'Failed to reset password'
        showErrorAlert('Failed to reset password. Please try again.')
      } finally {
        isPasswordResetProcessing.value = false
      }
    }
    
    return {
      userName,
      userEmail,
      nameChanged,
      emailChanged,
      isNameChangeProcessing,
      isEmailChangeProcessing,
      isValidEmail,
      newPassword,
      confirmPassword,
      passwordError,
      isPasswordResetProcessing,
      canResetPassword,
      closeModal,
      updateUserName,
      updateUserEmail,
      resetUserPassword
    }
  }
}
</script>

<style scoped>
/* Modal overlay and animation */
.modal-overlay {
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

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  position: relative;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Modal header */
.modal-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: var(--primary);
  font-size: 20px;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-close:hover {
  color: #8B5CF6;
}

/* User role badges */
.user-role {
  margin-bottom: 20px;
  text-align: center;
}

.badge-admin {
  background-color: #8B5CF6; /* Purple for Admin */
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  display: inline-block;
  margin-right: 10px;
}

.badge-user {
  background-color: #4CAF50; /* Green for User */
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  display: inline-block;
  margin-right: 10px;
}

/* Form layout */
.modal-body {
  padding: 10px 0;
}

.form-section {
  margin-bottom: 30px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.password-section {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px;
}

.password-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: var(--secondary);
}

/* Input styling */
.input-block {
  margin-bottom: 16px;
}

.input-block label {
  display: block;
  font-size: 14px;
  color: var(--secondary);
  margin-bottom: 4px;
}

.input-block input,
.input-block select {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px 15px;
  font-size: 16px;
  line-height: 24px;
  color: #3b4465;
  background: #eef9fe;
  border: 1px solid #cddbef;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.input-block input:focus,
.input-block select:focus {
  border-color: #8B5CF6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

/* Input row layouts */
.name-input-row,
.email-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.name-field,
.email-field {
  flex: 1;
}

.email-input-container {
  position: relative;
}

.email-input-row {
  margin-bottom: 20px;
}

.email-save-button {
  margin-top: 32px; /* Aligns the button with the email input */
}

/* Button styling */
.save-button {
  background-color: #e0e0e0;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: not-allowed;
  opacity: 0.7;
  transition: all 0.2s;
  height: 42px; /* Match input height */
  min-width: 80px; /* Ensure button doesn't change width when showing spinner */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
}

.save-button.active {
  background-color: var(--accent);
  color: white;
  cursor: pointer;
  opacity: 1;
}

.save-button.active:hover {
  background-color: #0069d9;
}

.save-button:disabled {
  background-color: #e0e0e0;
  color: #888;
  cursor: not-allowed;
  opacity: 0.7;
}

.password-button {
  background-color: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s;
  margin-top: 8px;
}

.password-button:hover:not(:disabled) {
  background-color: #0069d9;
}

.password-button:disabled {
  background-color: #e0e0e0;
  color: #888;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Error message */
.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
  text-align: center;
}

/* Loading animations */
.loading-dots {
  position: relative;
}

.loading-dots .dot {
  opacity: 0;
  animation: loadingDot 1.5s infinite;
  display: inline-block;
}

.loading-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 0.5s;
}

.loading-dots .dot:nth-child(3) {
  animation-delay: 1s;
}

@keyframes loadingDot {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 
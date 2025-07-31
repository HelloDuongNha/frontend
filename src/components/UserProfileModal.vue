<template>
  <div>
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>User Profile</h2>
          <button class="modal-close" @click="closeModal">&times;</button>
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
                    :disabled="isRestrictedUser"
                  >
                  <div v-if="isRestrictedUser" class="restricted-message">
                    Admin users or system emails cannot be changed
                  </div>
                </div>
              </div>
              <button 
                class="save-button email-save-button"
                :class="{ 'active': emailChanged && !isRestrictedUser }"
                :disabled="!emailChanged || !isValidEmail || isEmailChangeProcessing || isRestrictedUser"
                @click="initiateEmailChange"
              >
                <span v-if="!isEmailChangeProcessing">Save</span>
                <span v-else class="loading-container">
                  <span class="loading-spinner"></span>
                </span>
              </button>
            </div>
          </div>
          
          <!-- Change Password Section -->
          <div class="form-section password-section">
            <h3>Change Password</h3>
            
            <div class="input-block">
              <label for="current-password">Current Password</label>
              <input 
                id="current-password" 
                type="password" 
                v-model="currentPassword"
                placeholder="Enter current password"
              >
              <div class="forgot-password-link">
                <a href="#" @click.prevent="showForgotPasswordModal = true">Forgot Password?</a>
              </div>
            </div>
            
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
              :disabled="!canChangePassword || isPasswordChangeProcessing"
              @click="changePassword"
            >
              <span v-if="!isPasswordChangeProcessing">Save New Password</span>
              <span v-else class="loading-dots">
                Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Forgot Password Modal -->
    <div v-if="showForgotPasswordModal" class="modal-overlay">
      <div class="modal-content forgot-password-modal">
        <button class="modal-close" @click="closeForgotPasswordModal">&times;</button>
        <h2>Reset Password</h2>
        <form @submit.prevent="handleForgotPassword">
          <div class="input-block">
            <label for="forgot-email">E-mail</label>
            <input id="forgot-email" type="email" v-model="forgotEmail" required>
          </div>
          <div v-if="forgotError" class="error-message">
            {{ forgotError }}
          </div>
          <button type="submit" class="btn-forgot" :disabled="isForgotLoading">
            <span v-if="!isForgotLoading">Reset Password</span>
            <span v-else class="loading-dots">
              Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </button>
        </form>
      </div>
    </div>
    
    <!-- Email Change OTP Verification Modal -->
    <div v-if="showEmailChangeOTPModal" class="modal-overlay">
      <div class="modal-content">
        <button class="modal-close" @click="closeEmailChangeOTPModal">&times;</button>
        <h2>Verification</h2>
        <form @submit.prevent="handleEmailChangeOTP">
          <div class="otp-message">
            Please enter the verification code sent to your new email address ({{ newEmail }}).
          </div>
          <div class="input-block">
            <label for="email-change-otp">Verification Code</label>
            <input id="email-change-otp" type="text" v-model="emailChangeOTP" maxlength="6" required>
          </div>
          <div class="resend-code">
            <a 
              href="#" 
              @click.prevent="resendEmailChangeOTP" 
              :class="{ 'disabled': resendCooldown > 0 }"
            >
              {{ resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : "Didn't receive the code? Resend" }}
            </a>
          </div>
          <div v-if="emailChangeOTPError" class="error-message">
            {{ emailChangeOTPError }}
          </div>
          <button type="submit" class="btn-verify" :disabled="isEmailChangeOTPLoading">
            <span v-if="!isEmailChangeOTPLoading">Verify Code</span>
            <span v-else class="loading-dots">
              Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </button>
        </form>
      </div>
    </div>
    
    <!-- OTP Verification Modal -->
    <div v-if="showOTPModal" class="modal-overlay">
      <div class="modal-content">
        <button class="modal-close" @click="closeOTPModal">&times;</button>
        <h2>Verification</h2>
        <form @submit.prevent="handleOTPVerification">
          <div class="otp-message">{{ otpMessage }}</div>
          <div class="input-block">
            <label for="otp-code">Verification Code</label>
            <input id="otp-code" type="text" v-model="otpCode" maxlength="6" required>
          </div>
          <!-- Password fields only shown for reset password flow -->
          <div v-if="otpFlow === 'reset'" class="input-block">
            <label for="otp-new-password">New Password</label>
            <input id="otp-new-password" type="password" v-model="otpNewPassword" required>
          </div>
          <div v-if="otpFlow === 'reset'" class="input-block">
            <label for="otp-new-password-confirm">Confirm New Password</label>
            <input id="otp-new-password-confirm" type="password" v-model="otpNewPasswordConfirm" required>
          </div>
          <div class="resend-code">
            <a 
              href="#" 
              @click.prevent="resendOTPCode" 
              :class="{ 'disabled': resendCooldown > 0 }"
            >
              {{ resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : "Didn't receive the code? Resend" }}
            </a>
          </div>
          <div v-if="otpError" class="error-message">
            {{ otpError }}
          </div>
          <button type="submit" class="btn-verify" :disabled="isOtpLoading">
            <span v-if="!isOtpLoading">Verify Code</span>
            <span v-else class="loading-dots">
              Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { 
  initiateForgotPassword, 
  resetPassword, 
  resendOTP,
  updateUserProfile,
  changeUserPassword,
  sendProfileUpdateEmail,
  getUserId,
  initiateEmailChange as apiInitiateEmailChange,
  verifyEmailChange as apiVerifyEmailChange
} from '../helpers/api';
import Swal from 'sweetalert2';

export default {
  name: 'UserProfileModal',
  props: {
    // Initial user name from parent component
    initialUserName: {
      type: String,
      default: ''
    },
    // Initial user email from parent component
    initialUserEmail: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'update-profile'],
  setup(props, { emit }) {
    // User basic information
    const userName = ref(props.initialUserName);
    const userEmail = ref(props.initialUserEmail);
    const userRole = ref(localStorage.getItem('userRole') || 'user');
    const nameChanged = ref(false);
    const emailChanged = ref(false);
    const isNameChangeProcessing = ref(false);
    
    // Password change state
    const currentPassword = ref('');
    const newPassword = ref('');
    const confirmPassword = ref('');
    const passwordError = ref('');
    const isPasswordChangeProcessing = ref(false);
    
    // Forgot password flow state
    const showForgotPasswordModal = ref(false);
    const forgotEmail = ref('');
    const forgotError = ref('');
    const isForgotLoading = ref(false);
    
    // Email change OTP verification state
    const showEmailChangeOTPModal = ref(false);
    const emailChangeOTP = ref('');
    const emailChangeOTPError = ref('');
    const isEmailChangeOTPLoading = ref(false);
    const isEmailChangeProcessing = ref(false);
    const newEmail = ref('');
    
    // OTP verification flow state
    const showOTPModal = ref(false);
    const otpCode = ref('');
    const otpMessage = ref('');
    const otpError = ref('');
    const otpFlow = ref(''); // 'reset' for password reset flow
    const otpNewPassword = ref('');
    const otpNewPasswordConfirm = ref('');
    const currentUserId = ref('');
    const isOtpLoading = ref(false);
    const resendCooldown = ref(0);
    
    // Email validation
    const isValidEmail = computed(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(userEmail.value);
    });
    
    // Password validation
    const canChangePassword = computed(() => {
      return currentPassword.value && 
             newPassword.value && 
             confirmPassword.value && 
             newPassword.value === confirmPassword.value &&
             newPassword.value.length >= 6;
    });
    
    // Check if user is restricted from changing email
    const isRestrictedUser = computed(() => {
      // System administrator email or admin role users cannot change email
      return userEmail.value === 'admin@system.com' || userRole.value === 'admin';
    });
    
    // Initialize data from localStorage on component mount
    onMounted(() => {
      const storedName = localStorage.getItem('userName');
      const storedEmail = localStorage.getItem('userEmail');
      const storedRole = localStorage.getItem('userRole');
      
      if (storedName) {
        userName.value = storedName;
      }
      
      if (storedEmail) {
        userEmail.value = storedEmail;
      }
      
      if (storedRole) {
        userRole.value = storedRole;
      }
      
      // Reset change flags since we just loaded initial values
      nameChanged.value = false;
      emailChanged.value = false;
      
      // Get current user ID
      currentUserId.value = localStorage.getItem('userId') || getUserId();
    });
    
    // Close main modal
    const closeModal = () => {
      emit('close');
    };
    
    // Show success notification
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
      });
    };
    
    // Show error notification
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
      });
    };
    
    // Update user name only
    const updateUserName = async () => {
      try {
        // Show loading state
        isNameChangeProcessing.value = true;
        
        const userId = currentUserId.value;
        const updateData = { name: userName.value };
        
        const result = await updateUserProfile(userId, updateData);
        
        if (result.success) {
          // Reset change flag
          nameChanged.value = false;
          
          // Send confirmation email
          await sendProfileUpdateEmail('name', userEmail.value, userName.value);
          
          showSuccessAlert('Name updated successfully!');
          
          // Emit event to notify parent component that profile has been updated
          emit('update-profile', { name: userName.value, email: userEmail.value });
        } else {
          throw new Error(result.error || 'Failed to update name');
        }
      } catch (err) {
        console.error('Error updating user name:', err);
        showErrorAlert('Failed to update name. Please try again.');
      } finally {
        isNameChangeProcessing.value = false;
      }
    };
    
    // Initiate email change - send OTP to new email
    const initiateEmailChange = async () => {
      try {
        if (!isValidEmail.value) {
          showErrorAlert('Please enter a valid email address.');
          return;
        }
        
        // Check if user is restricted
        if (isRestrictedUser.value) {
          showErrorAlert('Admin accounts or system emails cannot be changed.');
          return;
        }
        
        // Show loading state immediately on the button
        isEmailChangeProcessing.value = true;
        
        // Store the new email
        newEmail.value = userEmail.value;
        
        // Call API to send OTP to the new email and wait for it to complete
        const result = await apiInitiateEmailChange(currentUserId.value, newEmail.value);
        
        if (result.success) {
          // Only show the OTP modal after successful API call
          showEmailChangeOTPModal.value = true;
          
          // Start cooldown for resend button
          startResendCooldown();
        } else {
          // Throw the error from the API response
          throw new Error(result.error || 'Failed to send verification code');
        }
        
      } catch (err) {
        console.error('Error initiating email change:', err);
        // Display the exact error message from the server in SweetAlert
        showErrorAlert(err.message || 'Failed to send verification code. Please try again.');
      } finally {
        isEmailChangeProcessing.value = false;
      }
    };
    
    // Handle email change OTP verification
    const handleEmailChangeOTP = async () => {
      if (!emailChangeOTP.value) {
        emailChangeOTPError.value = 'Please enter the verification code';
        return;
      }
      
      try {
        isEmailChangeOTPLoading.value = true;
        emailChangeOTPError.value = '';
        
        // Verify OTP and update email
        const result = await apiVerifyEmailChange(currentUserId.value, emailChangeOTP.value, newEmail.value);
        
        if (result.success) {
          // Close modal
          showEmailChangeOTPModal.value = false;
          
          // Reset change flag
          emailChanged.value = false;
          
          // Update the email in the local view (localStorage is updated in the API function)
          userEmail.value = newEmail.value;
          
          // Show success alert
          showSuccessAlert('Email updated successfully! Confirmation emails have been sent.');
          
          // Emit event to notify parent component that profile has been updated
          emit('update-profile', { name: userName.value, email: newEmail.value });
        } else {
          emailChangeOTPError.value = result.error || 'Invalid verification code';
        }
      } catch (err) {
        console.error('Error verifying email change:', err);
        emailChangeOTPError.value = 'An error occurred during verification';
      } finally {
        isEmailChangeOTPLoading.value = false;
      }
    };
    
    // Resend email change OTP
    const resendEmailChangeOTP = async () => {
      if (resendCooldown.value > 0) {
        showSuccessAlert('Please wait before resending the code.');
        return;
      }
      
      try {
        isEmailChangeOTPLoading.value = true;
        emailChangeOTPError.value = '';
        
        // Call API to resend OTP
        const result = await apiInitiateEmailChange(currentUserId.value, newEmail.value);
        
        if (result.success) {
          showSuccessAlert('Verification code has been resent successfully!');
          startResendCooldown();
        } else {
          throw new Error(result.error || 'Failed to resend verification code');
        }
      } catch (err) {
        console.error('Error resending email change OTP:', err);
        emailChangeOTPError.value = 'Failed to resend verification code';
      } finally {
        isEmailChangeOTPLoading.value = false;
      }
    };
    
    // Start cooldown timer for resend button
    const startResendCooldown = () => {
      resendCooldown.value = 20;
      const timer = setInterval(() => {
        resendCooldown.value--;
        if (resendCooldown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    };
    
    // Close email change OTP modal
    const closeEmailChangeOTPModal = () => {
      if (!isEmailChangeOTPLoading.value) {
        showEmailChangeOTPModal.value = false;
        emailChangeOTP.value = '';
        emailChangeOTPError.value = '';
      }
    };
    
    // Change password
    const changePassword = async () => {
      passwordError.value = '';
      
      if (!canChangePassword.value) {
        passwordError.value = 'Please fill all fields correctly';
        return;
      }
      
      try {
        // Show loading state
        isPasswordChangeProcessing.value = true;
        
        const userId = currentUserId.value;
        const result = await changeUserPassword(
          userId,
          currentPassword.value,
          newPassword.value
        );
        
        if (result.success) {
          // Send confirmation email
          await sendProfileUpdateEmail('password', userEmail.value, userName.value);
          
          showSuccessAlert('Password changed successfully!');
          
          // Reset password fields
          currentPassword.value = '';
          newPassword.value = '';
          confirmPassword.value = '';
        } else {
          throw new Error(result.error || 'Failed to change password');
        }
      } catch (err) {
        console.error('Error changing password:', err);
        passwordError.value = 'Current password is incorrect or an error occurred';
        showErrorAlert('Failed to change password. Please verify your current password.');
      } finally {
        isPasswordChangeProcessing.value = false;
      }
    };
    
    // Forgot password modal functions
    const closeForgotPasswordModal = () => {
      if (!isForgotLoading.value) {
        showForgotPasswordModal.value = false;
        forgotError.value = '';
      }
    };
    
    // Handle forgot password request
    const handleForgotPassword = async () => {
      forgotError.value = '';
      
      if (!forgotEmail.value) {
        forgotError.value = 'Please enter your email address';
        return;
      }
      
      try {
        isForgotLoading.value = true;
        const result = await initiateForgotPassword(forgotEmail.value);
        
        if (result.success) {
          // Move to OTP verification for password reset
          showForgotPasswordModal.value = false;
          otpFlow.value = 'reset';
          currentUserId.value = result.userId;
          otpMessage.value = `Please verify your email address (${forgotEmail.value}) with the code we just sent.`;
          showOTPModal.value = true;
        } else {
          forgotError.value = result.error || 'Failed to process request. Please try again.';
        }
      } catch (err) {
        console.error('Error during forgot password:', err);
        forgotError.value = 'An error occurred. Please try again.';
      } finally {
        isForgotLoading.value = false;
      }
    };
    
    // OTP verification modal functions
    const closeOTPModal = () => {
      if (!isOtpLoading.value) {
        showOTPModal.value = false;
        otpError.value = '';
      }
    };
    
    // Handle OTP verification
    const handleOTPVerification = async () => {
      otpError.value = '';
      
      if (!otpCode.value) {
        otpError.value = 'Please enter the verification code';
        return;
      }
      
      // For reset flow, validate passwords
      if (otpFlow.value === 'reset') {
        if (!otpNewPassword.value || !otpNewPasswordConfirm.value) {
          otpError.value = 'Please enter your new password';
          return;
        }
        
        if (otpNewPassword.value !== otpNewPasswordConfirm.value) {
          otpError.value = 'Passwords do not match';
          return;
        }
        
        if (otpNewPassword.value.length < 6) {
          otpError.value = 'Password must be at least 6 characters';
          return;
        }
      }
      
      try {
        isOtpLoading.value = true;
        
        if (otpFlow.value === 'reset') {
          // Reset password with OTP
          const result = await resetPassword(currentUserId.value, otpCode.value, otpNewPassword.value);
          
          if (result.success) {
            showOTPModal.value = false;
            showSuccessAlert('Your password has been reset successfully.');
            
            // Reset all fields
            otpCode.value = '';
            otpNewPassword.value = '';
            otpNewPasswordConfirm.value = '';
          } else {
            otpError.value = result.error || 'Password reset failed. Please try again.';
          }
        }
      } catch (err) {
        console.error('Error during verification:', err);
        otpError.value = 'An error occurred during verification. Please try again.';
      } finally {
        isOtpLoading.value = false;
      }
    };
    
    // Resend OTP code
    const resendOTPCode = async () => {
      otpError.value = '';
      
      if (resendCooldown.value > 0) {
        showSuccessAlert('Please wait before resending the code.');
        return;
      }
      
      try {
        isOtpLoading.value = true;
        
        const result = await resendOTP(currentUserId.value);
        
        if (result.success) {
          otpMessage.value = `A new verification code has been sent to your email.`;
          showSuccessAlert('Verification code has been resent successfully!');
          resendCooldown.value = 20; // Set cooldown to 20 seconds
          
          // Start cooldown timer
          const timer = setInterval(() => {
            resendCooldown.value--;
            if (resendCooldown.value <= 0) {
              clearInterval(timer);
            }
          }, 1000);
        } else {
          otpError.value = result.error || 'Failed to resend code. Please try again.';
        }
      } catch (err) {
        console.error('Error resending code:', err);
        otpError.value = 'An error occurred. Please try again.';
      } finally {
        isOtpLoading.value = false;
      }
    };
    
    return {
      // User info
      userName,
      userEmail,
      userRole,
      nameChanged,
      emailChanged,
      isNameChangeProcessing,
      isValidEmail,
      isRestrictedUser,
      updateUserName,
      initiateEmailChange,
      
      // Password
      currentPassword,
      newPassword,
      confirmPassword,
      passwordError,
      isPasswordChangeProcessing,
      canChangePassword,
      changePassword,
      
      // Forgot password
      showForgotPasswordModal,
      forgotEmail,
      forgotError,
      isForgotLoading,
      closeForgotPasswordModal,
      handleForgotPassword,
      
      // Email change OTP
      showEmailChangeOTPModal,
      emailChangeOTP,
      emailChangeOTPError,
      isEmailChangeOTPLoading,
      isEmailChangeProcessing,
      newEmail,
      closeEmailChangeOTPModal,
      handleEmailChangeOTP,
      resendEmailChangeOTP,
      
      // OTP verification
      showOTPModal,
      otpCode,
      otpMessage,
      otpError,
      otpFlow,
      otpNewPassword,
      otpNewPasswordConfirm,
      isOtpLoading,
      resendCooldown,
      closeOTPModal,
      handleOTPVerification,
      resendOTPCode,
      
      // Modal
      closeModal
    };
  }
};
</script>

<style scoped>
/* Modal overlay & animation */
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

.forgot-password-modal {
  max-width: 400px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Modal header & close button */
.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: var(--primary);
  font-size: 20px;
}

.modal-content h2 {
  margin-top: 0;
  color: #8B5CF6;
  margin-bottom: 20px;
  text-align: center;
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

/* Form layout & sections */
.modal-body {
  padding: 20px;
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

/* Input fields styling */
.input-block {
  margin-bottom: 16px;
}

.input-block label {
  display: block;
  font-size: 14px;
  color: var(--secondary);
  margin-bottom: 4px;
}

.input-block input {
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

.input-block input:focus {
  border-color: #8B5CF6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.input-block input:disabled {
  background-color: #f5f5f5;
  border-color: #ddd;
  color: #888;
  cursor: not-allowed;
}

/* Input row layouts */
.name-input-row,
.email-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.name-field,
.email-field {
  flex: 1;
}

.email-input-container {
  position: relative;
}

.email-input-row {
  align-items: flex-start;
  margin-bottom: 20px;
}

.email-save-button {
  margin-top: 32px; /* This aligns the button with the email input */
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

/* Specialized buttons */
.btn-forgot,
.btn-verify {
  display: block;
  margin: 20px auto 0;
  padding: 12px 24px;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.3s ease;
}

.btn-forgot:hover:not(:disabled),
.btn-verify:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-forgot:disabled,
.btn-verify:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Message & error displays */
.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
  text-align: center;
}

.forgot-password-link {
  text-align: right;
  margin-top: 4px;
}

.forgot-password-link a {
  font-size: 12px;
  color: var(--accent);
  text-decoration: none;
}

.forgot-password-link a:hover {
  text-decoration: underline;
}

.otp-message {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f0f9ff;
  border-left: 3px solid #8B5CF6;
  color: #3b4465;
  font-size: 14px;
}

.restricted-message {
  font-size: 12px;
  color: #dc3545;
  margin-top: 4px;
  font-style: italic;
}

/* Resend code link */
.resend-code {
  margin-top: 15px;
  font-size: 14px;
  text-align: right;
}

.resend-code a {
  color: #8B5CF6;
  text-decoration: none;
}

.resend-code a:hover:not(.disabled) {
  text-decoration: underline;
}

.resend-code a.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #999;
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
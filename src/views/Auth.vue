<template>
  <section class="forms-section">
    <div class="forms">
      <!-- Login Form -->
      <div class="form-wrapper" :class="{ 'is-active': activeForm === 'login' }">
        <button type="button" class="switcher switcher-login" @click="setActiveForm('login')">
          Login
          <span class="underline"></span>
        </button>
        <form class="form form-login" @submit.prevent="handleLogin">
          <fieldset>
            <legend>Please, enter your email and password for login.</legend>
            <div class="input-block">
              <label for="login-email">E-mail</label>
              <input id="login-email" type="email" v-model="loginEmail" required>
            </div>
            <div class="input-block">
              <label for="login-password">Password</label>
              <input id="login-password" type="password" v-model="loginPassword" required>
            </div>
            <div class="forgot-password-link">
              <a href="#" @click.prevent="showForgotPasswordModal = true">Forgot Password?</a>
            </div>
            <div v-if="loginError" class="error-message">
              {{ loginError }}
            </div>
          </fieldset>
          <button type="submit" class="btn-login" :disabled="isLoginLoading">
            <span v-if="!isLoginLoading">Login</span>
            <span v-else class="loading-dots">
              Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </button>
        </form>
      </div>
      
      <!-- Sign Up Form -->
      <div class="form-wrapper" :class="{ 'is-active': activeForm === 'signup' }">
        <button type="button" class="switcher switcher-signup" @click="setActiveForm('signup')">
          Sign Up
          <span class="underline"></span>
        </button>
        <form class="form form-signup" @submit.prevent="handleSignup">
          <fieldset>
            <legend>Please, enter your email, password and password confirmation for sign up.</legend>
            <div class="input-block">
              <label for="signup-name">Full Name</label>
              <input id="signup-name" type="text" v-model="signupName" required>
            </div>
            <div class="input-block">
              <label for="signup-email">E-mail</label>
              <input id="signup-email" type="email" v-model="signupEmail" required>
            </div>
            <div class="input-block">
              <label for="signup-password">Password</label>
              <input id="signup-password" type="password" v-model="signupPassword" required>
            </div>
            <div class="input-block">
              <label for="signup-password-confirm">Confirm password</label>
              <input id="signup-password-confirm" type="password" v-model="signupPasswordConfirm" required>
            </div>
            <div v-if="signupError" class="error-message">
              {{ signupError }}
            </div>
          </fieldset>
          <button type="submit" class="btn-signup" :disabled="isSignupLoading">
            <span v-if="!isSignupLoading">Sign Up</span>
            <span v-else class="loading-dots">
              Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </button>
        </form>
      </div>
    </div>
    
    <!-- OTP Verification Modal -->
    <div class="modal-overlay" v-if="showOTPModal" @click.self="closeOTPModal">
      <div class="modal-content">
        <button class="modal-close" @click="closeOTPModal">&times;</button>
        <h2>Verification</h2>
        <form @submit.prevent="handleOTPVerification">
          <div class="otp-message">{{ otpMessage }}</div>
          <div class="input-block">
            <label for="otp-code">Verification Code</label>
            <input id="otp-code" type="text" v-model="otpCode" maxlength="6" required>
          </div>
          <!-- Password fields only shown for reset password flow, not for signup or login -->
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
    
    <!-- Forgot Password Modal -->
    <div class="modal-overlay" v-if="showForgotPasswordModal" @click.self="closeForgotPasswordModal">
      <div class="modal-content">
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
  </section>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  loginUser,
  initiateRegister,
  verifyAndCompleteRegistration,
  resendOTP,
  verifyEmail,
  initiateForgotPassword,
  resetPassword,
  isUserLoggedIn
} from '../helpers/api'
import Swal from 'sweetalert2'

export default {
  name: 'Auth',
  setup() {
    const router = useRouter()
    const activeForm = ref('login')
    
    // Loading state variables
    const isLoginLoading = ref(false)
    const isSignupLoading = ref(false)
    const isOtpLoading = ref(false)
    const isForgotLoading = ref(false)
    
    // Login form data
    const loginEmail = ref('')
    const loginPassword = ref('')
    const loginError = ref('')
    
    // Signup form data
    const signupName = ref('')
    const signupEmail = ref('')
    const signupPassword = ref('')
    const signupPasswordConfirm = ref('')
    const signupError = ref('')
    
    // Forgot password form data
    const forgotEmail = ref('')
    const forgotError = ref('')
    
    // OTP verification data
    const otpCode = ref('')
    const otpMessage = ref('')
    const otpError = ref('')
    const otpFlow = ref('') // 'signup', 'login', or 'reset'
    const otpNewPassword = ref('')
    const otpNewPasswordConfirm = ref('')
    const currentUserId = ref('')
    const currentEmail = ref('')
    
    // Modal visibility controls
    const showOTPModal = ref(false)
    const showForgotPasswordModal = ref(false)
    
    // Cooldown timer for OTP resend
    const resendCooldown = ref(0)
    
    // Redirect if already logged in
    if (isUserLoggedIn()) {
      router.push('/home')
    }
    
    // Display success toast notification
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
    
    // Toggle between login and signup forms
    const setActiveForm = (form) => {
      activeForm.value = form
      // Clear errors when switching forms
      loginError.value = ''
      signupError.value = ''
      forgotError.value = ''
      otpError.value = ''
    }
    
    // Close OTP verification modal if not loading
    const closeOTPModal = () => {
      if (!isOtpLoading.value) {
        showOTPModal.value = false
      }
    }
    
    // Close forgot password modal if not loading
    const closeForgotPasswordModal = () => {
      if (!isForgotLoading.value) {
        showForgotPasswordModal.value = false
        forgotError.value = ''
      }
    }
    
    // Handle login form submission
    const handleLogin = async () => {
      loginError.value = ''
      
      if (!loginEmail.value || !loginPassword.value) {
        loginError.value = 'Please fill in all fields'
        return
      }
      
      try {
        isLoginLoading.value = true
        const result = await loginUser(loginEmail.value, loginPassword.value)
        
        if (result.requiresVerification) {
          // User needs to verify email with OTP
          otpFlow.value = 'login'
          currentUserId.value = result.userId
          currentEmail.value = loginEmail.value
          otpMessage.value = `Please verify your email address (${loginEmail.value}) with the code we just sent.`
          showOTPModal.value = true
        } else if (result.success) {
          // Login successful
          showSuccessAlert(`Welcome back, ${result.user.name || 'User'}!`)
          
          // Add a small delay before redirecting to allow the alert to be seen
          setTimeout(() => {
          router.push('/home')
          }, 1000)
        } else {
          loginError.value = result.error || 'Login failed. Please check your credentials.'
        }
      } catch (err) {
        console.error('Error during login:', err)
        loginError.value = 'An error occurred during login. Please try again.'
      } finally {
        isLoginLoading.value = false
      }
    }
    
    // Handle signup step 1 - Send verification code
    const handleSignup = async () => {
      signupError.value = ''
      
      // Validate inputs
      if (!signupName.value || !signupEmail.value || !signupPassword.value || !signupPasswordConfirm.value) {
        signupError.value = 'Please fill in all fields'
        return
      }
      
      if (signupPassword.value !== signupPasswordConfirm.value) {
        signupError.value = 'Passwords do not match'
        return
      }
      
      if (signupPassword.value.length < 6) {
        signupError.value = 'Password must be at least 6 characters'
        return
      }
      
      try {
        isSignupLoading.value = true
        const result = await initiateRegister(signupEmail.value, signupName.value)
        
        if (result.success) {
          // Move to OTP verification step
          otpFlow.value = 'signup'
          currentUserId.value = result.userId
          currentEmail.value = signupEmail.value
          otpMessage.value = `Please verify your email address (${signupEmail.value}) with the code we just sent.`
          // Store the password for later use in verification
          otpNewPassword.value = signupPassword.value
          otpNewPasswordConfirm.value = signupPasswordConfirm.value
          showOTPModal.value = true
        } else {
          signupError.value = result.error || 'Registration failed. Please try again.'
        }
      } catch (err) {
        console.error('Error during registration:', err)
        signupError.value = 'An error occurred during registration. Please try again.'
      } finally {
        isSignupLoading.value = false
      }
    }
    
    // Handle forgot password request
    const handleForgotPassword = async () => {
      forgotError.value = ''
      
      if (!forgotEmail.value) {
        forgotError.value = 'Please enter your email address'
        return
      }
      
      try {
        isForgotLoading.value = true
        const result = await initiateForgotPassword(forgotEmail.value)
        
        if (result.success) {
          // Move to OTP verification for password reset
          showForgotPasswordModal.value = false
          otpFlow.value = 'reset'
          currentUserId.value = result.userId
          currentEmail.value = forgotEmail.value
          otpMessage.value = `Please verify your email address (${forgotEmail.value}) with the code we just sent.`
          showOTPModal.value = true
        } else {
          forgotError.value = result.error || 'Failed to process request. Please try again.'
        }
      } catch (err) {
        console.error('Error during forgot password:', err)
        forgotError.value = 'An error occurred. Please try again.'
      } finally {
        isForgotLoading.value = false
      }
    }
    
    // Handle OTP verification for all flows (signup, login, password reset)
    const handleOTPVerification = async () => {
      otpError.value = ''
      
      if (!otpCode.value) {
        otpError.value = 'Please enter the verification code'
        return
      }
      
      // For reset flow, validate passwords
      if (otpFlow.value === 'reset') {
        if (!otpNewPassword.value || !otpNewPasswordConfirm.value) {
          otpError.value = 'Please enter your new password'
          return
        }
        
        if (otpNewPassword.value !== otpNewPasswordConfirm.value) {
          otpError.value = 'Passwords do not match'
          return
        }
        
        if (otpNewPassword.value.length < 6) {
          otpError.value = 'Password must be at least 6 characters'
          return
        }
      }
      
      try {
        isOtpLoading.value = true
        
        let result
        
        // Handle different OTP verification flows
        if (otpFlow.value === 'signup') {
          // Complete registration with OTP verification
          result = await verifyAndCompleteRegistration(
            currentUserId.value, 
            otpCode.value, 
            otpNewPassword.value, 
            signupName.value
          )
          
          if (result.success) {
            showOTPModal.value = false
            showSuccessAlert('Your account has been successfully created. Please log in.')
            // Reset form and go to login
            resetForms()
            setActiveForm('login')
          } else {
            otpError.value = result.error || 'Verification failed. Please try again.'
          }
        } else if (otpFlow.value === 'login') {
          // Verify email during login
          result = await verifyEmail(currentUserId.value, otpCode.value)
          
          if (result.success) {
            // Try login again automatically
            const loginResult = await loginUser(currentEmail.value, loginPassword.value)
            
            if (loginResult.success) {
              showOTPModal.value = false
              showSuccessAlert(`Welcome back, ${loginResult.user.name || 'User'}!`)
              router.push('/home')
            } else {
              otpError.value = 'Email verified, but login failed. Please try logging in again.'
              showOTPModal.value = false
              setActiveForm('login')
            }
          } else {
            otpError.value = result.error || 'Verification failed. Please try again.'
          }
        } else if (otpFlow.value === 'reset') {
          // Reset password with OTP
          result = await resetPassword(currentUserId.value, otpCode.value, otpNewPassword.value)
          
          if (result.success) {
            showOTPModal.value = false
            showSuccessAlert('Your password has been reset successfully. Please log in with your new password.')
            // Reset form and go to login
            resetForms()
            setActiveForm('login')
          } else {
            otpError.value = result.error || 'Password reset failed. Please try again.'
          }
        }
      } catch (err) {
        console.error('Error during verification:', err)
        otpError.value = 'An error occurred during verification. Please try again.'
      } finally {
        isOtpLoading.value = false
      }
    }
    
    // Resend OTP verification code
    const resendOTPCode = async () => {
      otpError.value = ''
      
      if (resendCooldown.value > 0) {
        showSuccessAlert('Please wait before resending the code.')
        return
      }

      try {
        isOtpLoading.value = true
        
        const result = await resendOTP(currentUserId.value)
        
        if (result.success) {
          otpMessage.value = `A new verification code has been sent to ${currentEmail.value}.`
          showSuccessAlert('Verification code has been resent successfully!')
          resendCooldown.value = 20 // Set cooldown to 20 seconds
          
          // Start cooldown timer
          const timer = setInterval(() => {
            resendCooldown.value--
            if (resendCooldown.value <= 0) {
              clearInterval(timer)
            }
          }, 1000)
        } else {
          otpError.value = result.error || 'Failed to resend code. Please try again.'
        }
      } catch (err) {
        console.error('Error resending code:', err)
        otpError.value = 'An error occurred. Please try again.'
      } finally {
        isOtpLoading.value = false
      }
    }
    
    // Reset all form fields
    const resetForms = () => {
      // Login form
      loginEmail.value = ''
      loginPassword.value = ''
      loginError.value = ''
      
      // Signup form
      signupName.value = ''
      signupEmail.value = ''
      signupPassword.value = ''
      signupPasswordConfirm.value = ''
      signupError.value = ''
      
      // Forgot password form
      forgotEmail.value = ''
      forgotError.value = ''
      
      // OTP form
      otpCode.value = ''
      otpMessage.value = ''
      otpError.value = ''
      otpNewPassword.value = ''
      otpNewPasswordConfirm.value = ''
      currentUserId.value = ''
      currentEmail.value = ''
    }
    
    return {
      // Form visibility
      activeForm,
      
      // Loading states
      isLoginLoading,
      isSignupLoading,
      isOtpLoading,
      isForgotLoading,
      
      // Login form
      loginEmail,
      loginPassword,
      loginError,
      
      // Signup form
      signupName,
      signupEmail,
      signupPassword,
      signupPasswordConfirm,
      signupError,
      
      // Forgot password form
      forgotEmail,
      forgotError,
      
      // OTP verification
      otpCode,
      otpMessage,
      otpError,
      otpFlow,
      otpNewPassword,
      otpNewPasswordConfirm,
      
      // Modal controls
      showOTPModal,
      showForgotPasswordModal,
      closeOTPModal,
      closeForgotPasswordModal,
      
      // Cooldown
      resendCooldown,
      
      // Methods
      setActiveForm,
      handleLogin,
      handleSignup,
      handleForgotPassword,
      handleOTPVerification,
      resendOTPCode
    }
  }
}
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.forms-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: white;
  width: 100%;
  position: relative;
}

.forms {
  display: flex;
  align-items: flex-start;
  margin-top: 30px;
}

.form-wrapper {
  animation: hideLayer .3s ease-out forwards;
}

.form-wrapper.is-active {
  animation: showLayer .3s ease-in forwards;
}

@keyframes showLayer {
  50% {
    z-index: 1;
  }
  100% {
    z-index: 1;
  }
}

@keyframes hideLayer {
  0% {
    z-index: 1;
  }
  49.999% {
    z-index: 1;
  }
}

.switcher {
  position: relative;
  cursor: pointer;
  display: block;
  margin-right: auto;
  margin-left: auto;
  padding: 0;
  text-transform: uppercase;
  font-family: inherit;
  font-size: 16px;
  letter-spacing: .5px;
  color: #999;
  background-color: transparent;
  border: none;
  outline: none;
  transform: translateX(0);
  transition: all .3s ease-out;
}

.form-wrapper.is-active .switcher-login,
.form-wrapper.is-active .switcher-signup {
  color: #8B5CF6;
  transform: translateX(0);
}

.form-wrapper.is-active .switcher-login {
  transform: translateX(90px);
}

.form-wrapper.is-active .switcher-signup {
  transform: translateX(-90px);
}

.underline {
  position: absolute;
  bottom: -5px;
  left: 0;
  overflow: hidden;
  pointer-events: none;
  width: 100%;
  height: 2px;
}

.underline::before {
  content: '';
  position: absolute;
  top: 0;
  left: inherit;
  display: block;
  width: inherit;
  height: inherit;
  background-color: currentColor;
  transition: transform .2s ease-out;
}

.switcher-login .underline::before {
  transform: translateX(101%);
}

.switcher-signup .underline::before {
  transform: translateX(-101%);
}

.form-wrapper.is-active .underline::before {
  transform: translateX(0);
}

.form {
  overflow: hidden;
  min-width: 300px;
  margin-top: 50px;
  padding: 30px 25px;
  border-radius: 5px;
  transform-origin: top;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.form-login,
.form-signup {
  animation: hideLogin .3s ease-out forwards;
}

.form-wrapper.is-active .form-login,
.form-wrapper.is-active .form-signup {
  animation: showLogin .3s ease-in forwards;
}

@keyframes showLogin {
  0% {
    background: #d7e7f1;
    transform: translate(40%, 10px);
  }
  50% {
    transform: translate(0, 0);
  }
  100% {
    background-color: #fff;
    transform: translate(35%, -20px);
  }
}

@keyframes hideLogin {
  0% {
    background-color: #fff;
    transform: translate(35%, -20px);
  }
  50% {
    transform: translate(0, 0);
  }
  100% {
    background: #d7e7f1;
    transform: translate(40%, 10px);
  }
}

.form fieldset {
  position: relative;
  opacity: 0;
  margin: 0;
  padding: 0;
  border: 0;
  transition: all .3s ease-out;
}

.form-login fieldset,
.form-signup fieldset {
  transform: translateX(-50%);
}

.form-wrapper.is-active fieldset {
  opacity: 1;
  transform: translateX(0);
  transition: opacity .4s ease-in, transform .35s ease-in;
}

.form legend {
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  clip: rect(0 0 0 0);
}

.input-block {
  margin-bottom: 20px;
}

.input-block label {
  font-size: 14px;
  color: #a1b4b4;
}

.input-block input {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding-right: 15px;
  padding-left: 15px;
  font-size: 16px;
  line-height: 40px;
  color: #3b4465;
  background: #eef9fe;
  border: 1px solid #cddbef;
  border-radius: 2px;
}

/* Modal Styles */
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
  max-width: 400px;
  position: relative;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
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

.otp-message {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f0f9ff;
  border-left: 3px solid #8B5CF6;
  color: #3b4465;
  font-size: 14px;
}

.resend-code {
  margin-top: 15px;
  font-size: 14px;
  text-align: right;
}

.forgot-password-link,
.login-link {
  margin-top: 10px;
  font-size: 14px;
  text-align: right;
}

.resend-code a,
.forgot-password-link a,
.login-link a {
  color: #8B5CF6;
  text-decoration: none;
}

.resend-code a:hover,
.forgot-password-link a:hover,
.login-link a:hover {
  text-decoration: underline;
}

.resend-code a.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  text-decoration: none;
  color: #999;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 10px;
  padding: 8px;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
  text-align: center;
}

.form [type='submit'],
.modal-content [type='submit'] {
  display: block;
  min-width: 120px;
  margin: 30px auto 10px;
  font-size: 18px;
  line-height: 40px;
  border-radius: 25px;
  border: none;
  transition: all .3s ease-out;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.form [type='submit'] {
  opacity: 0;
}

.form-wrapper.is-active .form [type='submit'] {
  opacity: 1;
  transform: translateX(0);
  transition: all .4s ease-in;
}

/* Common button style */
.btn-login,
.btn-signup,
.btn-verify,
.btn-forgot {
  color: white;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  border: 2px solid transparent; /* Invisible border initially */
  box-sizing: border-box; /* Include border in element's dimensions */
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  height: 44px; /* Fixed height */
  padding: 0 20px; /* Fixed padding */
}

/* Maintain original transformations for proper positioning */
.btn-login {
  transform: translateX(-30%);
}

.btn-signup {
  transform: translateX(30%);
}

.modal-content [type='submit'] {
  opacity: 1;
  transform: translateX(0);
}

/* Hover effect - all buttons */
.btn-login:hover:not(:disabled),
.btn-signup:hover:not(:disabled),
.btn-verify:hover:not(:disabled),
.btn-forgot:hover:not(:disabled) {
  color: #8B5CF6;
  background: transparent;
  border: 2px solid #8B5CF6; /* Visible border on hover */
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3); /* Outer glow for border */
}

/* Active effect - all buttons */
.btn-login:active:not(:disabled),
.btn-signup:active:not(:disabled),
.btn-verify:active:not(:disabled),
.btn-forgot:active:not(:disabled) {
  transform: translateY(2px);
}

/* Maintain specific transformations when active */
.btn-login:active:not(:disabled) {
  transform: translateX(-30%) translateY(2px);
}

.btn-signup:active:not(:disabled) {
  transform: translateX(30%) translateY(2px);
}

/* Disabled button style */
.btn-login:disabled,
.btn-signup:disabled,
.btn-verify:disabled,
.btn-forgot:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Loading dots animation */
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
</style>
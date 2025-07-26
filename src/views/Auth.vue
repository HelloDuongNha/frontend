<template>
  <section class="forms-section">
    <div class="forms">
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
            <div v-if="loginError" class="error-message">
              {{ loginError }}
            </div>
          </fieldset>
          <button type="submit" class="btn-login" :disabled="isLoading">
            {{ isLoading ? 'Loading...' : 'Login' }}
          </button>
        </form>
      </div>
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
          <button type="submit" class="btn-signup" :disabled="isLoading">
            {{ isLoading ? 'Loading...' : 'Sign Up' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser, registerUser, isUserLoggedIn } from '../helpers/api'

export default {
  name: 'Auth',
  setup() {
    const router = useRouter()
    const activeForm = ref('login')
    const isLoading = ref(false)
    
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
    
    // Check if user is already logged in
    if (isUserLoggedIn()) {
      router.push('/home')
    }
    
    const setActiveForm = (form) => {
      activeForm.value = form
      // Clear errors when switching forms
      loginError.value = ''
      signupError.value = ''
    }
    
    const handleLogin = async () => {
      loginError.value = ''
      
      if (!loginEmail.value || !loginPassword.value) {
        loginError.value = 'Please fill in all fields'
        return
      }
      
      try {
        isLoading.value = true
        const result = await loginUser(loginEmail.value, loginPassword.value)
        
        if (result.success) {
          console.log('Login successful:', result.user)
          router.push('/home')
        } else {
          loginError.value = result.error || 'Login failed. Please check your credentials.'
        }
      } catch (err) {
        console.error('Error during login:', err)
        loginError.value = 'An error occurred during login. Please try again.'
      } finally {
        isLoading.value = false
      }
    }
    
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
        isLoading.value = true
        const result = await registerUser(signupName.value, signupEmail.value, signupPassword.value)
        
        if (result.success) {
          console.log('Registration successful:', result.user)
          router.push('/home')
        } else {
          signupError.value = result.error || 'Registration failed. Please try again.'
        }
      } catch (err) {
        console.error('Error during registration:', err)
        signupError.value = 'An error occurred during registration. Please try again.'
      } finally {
        isLoading.value = false
      }
    }
    
    return {
      activeForm,
      isLoading,
      loginEmail,
      loginPassword,
      loginError,
      signupName,
      signupEmail,
      signupPassword,
      signupPasswordConfirm,
      signupError,
      setActiveForm,
      handleLogin,
      handleSignup
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

.form-wrapper.is-active .switcher-login {
  color: #8B5CF6;
  transform: translateX(90px);
}

.form-wrapper.is-active .switcher-signup {
  color: #8B5CF6;
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
  min-width: 260px;
  margin-top: 50px;
  padding: 30px 25px;
  border-radius: 5px;
  transform-origin: top;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.form-login {
  animation: hideLogin .3s ease-out forwards;
}

.form-wrapper.is-active .form-login {
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

.form-signup {
  animation: hideSignup .3s ease-out forwards;
}

.form-wrapper.is-active .form-signup {
  animation: showSignup .3s ease-in forwards;
}

@keyframes showSignup {
  0% {
    background: #d7e7f1;
    transform: translate(-40%, 10px) scaleY(.8);
  }
  50% {
    transform: translate(0, 0) scaleY(.8);
  }
  100% {
    background-color: #fff;
    transform: translate(-35%, -20px) scaleY(1);
  }
}

@keyframes hideSignup {
  0% {
    background-color: #fff;
    transform: translate(-35%, -20px) scaleY(1);
  }
  50% {
    transform: translate(0, 0) scaleY(.8);
  }
  100% {
    background: #d7e7f1;
    transform: translate(-40%, 10px) scaleY(.8);
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

.form-login fieldset {
  transform: translateX(-50%);
}

.form-signup fieldset {
  transform: translateX(50%);
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

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 10px;
  padding: 8px;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
  text-align: center;
}

.form [type='submit'] {
  opacity: 0;
  display: block;
  min-width: 120px;
  margin: 30px auto 10px;
  font-size: 18px;
  line-height: 40px;
  border-radius: 25px;
  border: none;
  transition: all .3s ease-out;
  cursor: pointer;
}

.form-wrapper.is-active .form [type='submit'] {
  opacity: 1;
  transform: translateX(0);
  transition: all .4s ease-in;
}

.btn-login {
  color: #fbfdff;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  transform: translateX(-30%);
}

.btn-signup {
  color: #8B5CF6;
  background: #fbfdff;
  box-shadow: inset 0 0 0 2px #8B5CF6;
  transform: translateX(30%);
}

.btn-login:disabled, .btn-signup:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
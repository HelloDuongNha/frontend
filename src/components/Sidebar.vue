<template>
  <aside class="sidebar">
    <!-- App Logo -->
    <div class="logo-container">
      <router-link to="/home" class="logo">
        <div class="logo-icon">M</div>
        <span class="logo-text">MINO</span>
      </router-link>
    </div>
    
    <!-- Add New Button -->
    <div class="sidebar-section">
      <button class="new-button" @click="showAddOptions = !showAddOptions">
        <span class="icon"><i class="bi bi-plus-circle-fill"></i></span>
        <span>Add new</span>
      </button>
      
      <!-- Add Options Dropdown -->
      <div v-if="showAddOptions" class="add-options">
        <button @click="createNew('note')">
          <i class="bi bi-file-earmark-text me-2"></i> New Note
        </button>
        <button @click="createNew('tag')">
          <i class="bi bi-tag me-2"></i> New Tag
        </button>
      </div>
    </div>
    
    <!-- Navigation Items -->
    <nav class="sidebar-nav">
      <router-link to="/home" class="nav-item" active-class="active">
        <span class="nav-icon">📝</span>
        <span class="nav-text">My Notes</span>
      </router-link>
      
      <router-link to="/calendar" class="nav-item" active-class="active">
        <span class="nav-icon">📅</span>
        <span class="nav-text">Calendar</span>
      </router-link>
      
      <router-link to="/tags" class="nav-item" active-class="active">
        <span class="nav-icon">🏷️</span>
        <span class="nav-text">My Tags</span>
      </router-link>
      
      <router-link to="/trash" class="nav-item" active-class="active">
        <span class="nav-icon">🗑️</span>
        <span class="nav-text">Trash</span>
      </router-link>
    </nav>
    
    <!-- Tags Section -->
    <div class="sidebar-section tags-section">
      <h3 class="section-title">
        <router-link to="/tags">Tags</router-link>
        <button class="add-tag-button" @click="createNew('tag')">+</button>
      </h3>
      <div v-if="isLoading" class="loading-tags">
        <span class="loading-text">Loading tags...</span>
      </div>
      <div v-else-if="tags.length > 0" class="tags-list">
        <a
          v-for="tag in tags"
          :key="tag._id"
          href="javascript:void(0);"
          class="tag-item"
          @click.prevent="handleTagClick(tag._id)"
        >
          <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
          <span class="tag-name">{{ tag.name }}</span>
        </a>
      </div>
      <div v-else class="empty-message">No tags yet</div>
    </div>
    
    <!-- Tag Form Modal -->
    <TagForm
      v-if="showTagForm"
      :tag="currentTag"
      :userId="userId"
      @submit="saveTag"
      @cancel="closeTagForm"
    />
    
    <!-- User Info & Logout Section -->
    <div class="user-logout-container">
      <!-- User Info -->
      <div class="user-info-container">
        <div class="user-avatar">
          <span class="avatar-initials">{{ userInitials }}</span>
        </div>
        <div class="user-details">
          <h2 class="user-name">{{ userName }}</h2>
          <p class="user-email">{{ userEmail }}</p>
        </div>
      </div>
      
      <!-- Logout Button -->
      <button class="logout-button" @click="logout">
        <i class="bi bi-box-arrow-right me-2"></i>
        Log Out
      </button>
    </div>
  </aside>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getTags, createTag, getUserId, logoutUser } from '../helpers/api'
import { generateRandomColor } from '../helpers/utils'
import TagForm from './TagForm.vue'
import Swal from 'sweetalert2'

export default {
  name: 'Sidebar',
  components: {
    TagForm
  },
  emits: ['tag-created', 'tag-updated'],
  setup(props, { emit }) {
    const router = useRouter()
    const route = useRoute()
    
    const userId = ref(getUserId())
    const showAddOptions = ref(false)
    const tags = ref([])
    const isLoading = ref(false)
    const showTagForm = ref(false)
    const currentTag = ref({})
    
    // User information
    const userName = ref('User')
    const userEmail = ref('user@example.com')
    const userInitials = computed(() => {
      if (!userName.value) return '?'
      return userName.value
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
    })
    
    // Get user information from localStorage
    onMounted(() => {
      const storedName = localStorage.getItem('userName')
      const storedEmail = localStorage.getItem('userEmail')
      
      if (storedName) {
        userName.value = storedName
      }
      
      if (storedEmail) {
        userEmail.value = storedEmail
      }
    })
    
    // Show success toast
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
    
    // Show error toast
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
    
    const fetchTags = async () => {
      try {
        isLoading.value = true
        const response = await getTags(userId.value)
        tags.value = response.data || []
        isLoading.value = false
      } catch (error) {
        console.error('Error fetching tags:', error)
        isLoading.value = false
        showErrorAlert('Failed to load tags.')
      }
    }
    
    const createNew = (type) => {
      showAddOptions.value = false
      
      if (type === 'note') {
        router.push('/home')
        // Use setTimeout to ensure the navigation completes before opening the form
        setTimeout(() => {
          emit('create-note')
          // Dispatch a custom event to open the note form
          window.dispatchEvent(new CustomEvent('open-note-form'))
        }, 100)
      } else if (type === 'tag') {
        openTagForm()
      }
    }

    // Add this function to handle tag click
    const handleTagClick = (tagId) => {
      // Force navigation even if we're already on the tags page
      if (route.path === `/tags/${tagId}`) {
        // We're already on this tag's page, trigger a refresh
        window.dispatchEvent(new CustomEvent('refresh-tag-notes', { detail: { tagId } }))
      } else {
        // Navigate to the tag detail page
        router.push(`/tags/${tagId}`)
      }
      // Close the sidebar on mobile if needed
      if (window.innerWidth <= 768) {
        // You might need to implement mobile sidebar toggle functionality
      }
    }
    
    const openTagForm = () => {
      currentTag.value = {
        name: '',
        color: generateRandomColor(),
        userId: userId.value
      }
      showTagForm.value = true
    }
    
    const closeTagForm = () => {
      showTagForm.value = false
      currentTag.value = {}
    }
    
    const saveTag = async (tagData) => {
      try {
        isLoading.value = true
        const response = await createTag(tagData)
        
        if (response.data) {
          tags.value.push(response.data)
          showSuccessAlert('Tag created successfully!')
          emit('tag-created', response.data)
        }
        
        closeTagForm()
        isLoading.value = false
        
        // If we're not already on the tags page, navigate there
        if (route.path !== '/tags') {
          router.push('/tags')
        } else {
          // Refresh the list
          fetchTags()
        }
      } catch (err) {
        console.error('Error creating tag:', err)
        isLoading.value = false
        showErrorAlert('Failed to create tag. Please try again.')
      }
    }
    
    // Watch for route changes to refresh tags when navigating to/from tags page
    watch(
      () => route.path,
      (newPath) => {
        if (newPath === '/tags') {
          fetchTags()
        }
      }
    )
    
    onMounted(() => {
      fetchTags()
    })

    const logout = () => {
      Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to log out.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, log out',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // Clear user data from localStorage using the logoutUser function
          logoutUser()
          
          // Redirect to login page
          router.push('/auth')
          
          showSuccessAlert('You have been logged out successfully.')
        }
      })
    }
    
    return {
      userId,
      showAddOptions,
      tags,
      isLoading,
      showTagForm,
      currentTag,
      createNew,
      openTagForm,
      closeTagForm,
      saveTag,
      handleTagClick,
      logout,
      userName,
      userEmail,
      userInitials
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100%;
  background-color: var(--background-alt);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: hidden; /* Không cho phép cuộn toàn bộ sidebar */
}

.logo-container {
  margin-bottom: 20px;
  padding: 8px 0;
}

.logo {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: var(--primary);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background-color: #121212;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
}

.new-button {
  display: flex;
  align-items: center;
  background-color: var(--accent, #007bff);
  color: white;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  width: 100%;
  margin-bottom: 10px;
  transition: all 0.2s;
  font-weight: 500;
}

.new-button:hover {
  background-color: #0069d9;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.new-button .icon {
  margin-right: 8px;
  font-size: 18px;
  display: flex;
  align-items: center;
}

.add-options {
  background-color: white;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  margin-bottom: 10px;
}

.add-options button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 16px;
  transition: background-color 0.2s;
}

.add-options button:hover {
  background-color: #f0f0f0;
}

.sidebar-nav {
  margin: 16px 0;
  flex-shrink: 0; /* Không cho phép co lại khi không đủ không gian */
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  margin: 2px 0;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}

.nav-item:hover, .nav-item.active {
  background-color: #f0f0f0;
}

.nav-icon {
  margin-right: 8px;
  font-size: 18px;
}

/* Phần tags section sẽ được phép cuộn */
.tags-section {
  display: flex;
  flex-direction: column;
  flex: 1; /* Chiếm phần không gian còn lại */
  min-height: 0; /* Quan trọng để cho phép flexbox co lại */
}

.section-title {
  margin: 16px 0 8px;
  font-size: 16px;
  color: var(--secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* Không cho phép co lại */
}

.add-tag-button {
  width: 20px;
  height: 20px;
  background-color: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s, background-color 0.2s;
}

.add-tag-button:hover {
  opacity: 1;
  background-color: #f0f0f0;
}

/* Chỉ cho phép cuộn danh sách tags */
.tags-list {
  overflow-y: auto; /* Cho phép cuộn trong phần này */
  margin-top: 8px;
  flex-grow: 1; /* Chiếm phần không gian còn lại */
  padding-right: 5px; /* Thêm padding bên phải để tránh thanh cuộn đè lên nội dung */
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  margin: 2px 0;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
  color: var(--text-primary);
  text-decoration: none;
}

.tag-item:hover {
  background-color: #f0f0f0;
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.empty-message {
  color: var(--secondary);
  font-size: 14px;
  margin: 8px 0;
}

.loading-tags {
  margin: 8px 0;
}

.loading-text {
  color: var(--secondary);
  font-size: 14px;
  font-style: italic;
}

/* User Info and Logout Styles */
.user-logout-container {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0; /* Không cho phép co lại */
}

.user-info-container {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  margin-bottom: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
}

.user-details {
  margin-left: 10px;
  overflow: hidden;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.user-email {
  font-size: 12px;
  color: var(--secondary);
  margin: 4px 0 0 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.logout-button {
  width: 100%;
  background-color: #dc3545;
  color: white;
  padding: 10px;
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.logout-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.logout-button .icon {
  margin-right: 8px;
  font-size: 18px;
  display: flex;
  align-items: center;
}

@media screen and (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
    padding: 8px;
  }
  
  .logo-container {
    margin-bottom: 10px;
  }
  
  .sidebar-nav {
    display: flex;
    overflow-x: auto;
    margin: 8px 0;
  }
  
  .nav-item {
    flex-shrink: 0;
    padding: 8px 16px;
  }
  
  .tags-section {
    display: none;
  }
  
  .user-logout-container {
    display: none;
  }
}
</style> 
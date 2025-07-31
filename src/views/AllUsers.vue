<template>
  <div class="users-page">
    <div class="section-header">
      <h2 class="section-title">All Users</h2>
    </div>
    
    <!-- Search Bar -->
    <div class="filter-section">
      <div class="search-container">
        <input 
          type="text"
          class="search-input"
          placeholder="Search users..."
          v-model="searchQuery"
          @input="performSearch"
        >
        <button class="search-button">
          <i class="bi bi-search"></i>
        </button>
      </div>
    </div>
    
    <!-- Users List -->
    <div v-if="isLoading" class="loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading users...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchUsers" class="retry-btn btn btn-primary">Try Again</button>
    </div>
    
    <div v-else-if="filteredUsers.length > 0" class="users-grid">
      <!-- Search Results Header (only when search is active) -->
      <div v-if="isSearchActive" class="search-results-header">
        <div class="results-info">
          <h2 class="section-title">
            Found {{ nonAdminFilteredUsers.length }} result{{ nonAdminFilteredUsers.length !== 1 ? 's' : '' }}
          </h2>
          <button class="clear-search-button" @click="clearSearch">
            <i class="bi bi-x-circle"></i> Clear Search
          </button>
        </div>
      </div>
      
      <div v-for="user in nonAdminFilteredUsers" :key="user._id" class="user-card" @click="navigateToUser(user)">
        <div class="user-row">
          <div class="user-info">
            <div class="user-avatar">
              <span>{{ getUserInitials(user) }}</span>
            </div>
            <div class="user-details">
              <h3 class="user-name">{{ user.name }}</h3>
              <p class="user-email">{{ user.email }}</p>
              <span v-if="user.role === 'user'" class="badge-user">User</span>
            </div>
          </div>
          <div class="user-actions">
            <button class="edit-btn" @click.stop="editUser(user)" title="Edit User">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="delete-btn" @click.stop="confirmDeleteUser(user)" title="Delete User">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <div class="user-stats">
          <div class="stats-item">
            <i class="bi bi-sticky"></i> 
            <span>{{ userStats[user._id]?.stats?.notesCount || '...' }} note{{ userStats[user._id]?.stats?.notesCount !== 1 ? 's' : '' }}</span>
          </div>
          <div class="stats-item">
            <i class="bi bi-tags"></i> 
            <span>{{ userStats[user._id]?.stats?.tagsCount || '...' }} tag{{ userStats[user._id]?.stats?.tagsCount !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="filteredUsers.length === 0 && !isSearchActive" class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>No Users Found</h3>
      <p>There are no users in the system yet.</p>
    </div>
    
    <div v-else-if="filteredUsers.length === 0 && isSearchActive" class="empty-search-results">
      <div class="empty-icon">🔍</div>
      <h3>No Matching Users</h3>
      <p>No users found matching your search.</p>
      <button class="btn btn-outline-secondary mt-3" @click="clearSearch">Clear Search</button>
    </div>
    
    <!-- User Edit Modal -->
    <UserEditModal
      v-if="showUserEditModal"
      :user="currentUser"
      @close="closeUserEditModal"
      @update="handleUserUpdate"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAllUsers, deleteUser, getUserStats, searchUsers } from '../helpers/api'
import Swal from 'sweetalert2'
import UserEditModal from '../components/UserEditModal.vue'

export default {
  name: 'AllUsers',
  components: {
    UserEditModal
  },
  setup() {
    const router = useRouter()
    
    // State management
    const users = ref([])
    const userStats = ref({})
    const isLoading = ref(false)
    const error = ref(null)
    const showUserEditModal = ref(false)
    const currentUser = ref({})
    
    // Search state
    const searchQuery = ref('')
    const isSearchActive = ref(false)
    const searchResults = ref([])
    const searchDebounceTimeout = ref(null)
    
    // Display users based on search state
    const filteredUsers = computed(() => {
      if (isSearchActive.value) {
        return searchResults.value
      }
      return users.value
    })

    // Filter out admin users from display
    const nonAdminFilteredUsers = computed(() => {
      return filteredUsers.value.filter(user => user.role !== 'admin')
    })
    
    // Show success toast notification
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
    
    // Show error toast notification
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
    
    // Extract initials from user's name for avatar
    const getUserInitials = (user) => {
      if (!user.name) return '?'
      return user.name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
    }
    
    // Fetch all users from API
    const fetchUsers = async () => {
      try {
        isLoading.value = true
        error.value = null
        
        const response = await getAllUsers()
        
        if (response.success) {
          users.value = response.data || []
          // After fetching users, get stats for each user
          fetchStatsForUsers()
        } else {
          throw new Error(response.error || 'Failed to fetch users')
        }
        
        isLoading.value = false
      } catch (err) {
        console.error('Error fetching users:', err)
        error.value = 'Failed to fetch users. ' + (err.message || '')
        isLoading.value = false
        showErrorAlert('Failed to fetch users. Please try again.')
      }
    }
    
    // Fetch note and tag stats for all users
    const fetchStatsForUsers = async () => {
      // Reset stats
      userStats.value = {}
      
      // Fetch stats for each user
      for (const user of users.value) {
        try {
          const response = await getUserStats(user._id)
          if (response.success) {
            userStats.value[user._id] = response.data
          } else {
            userStats.value[user._id] = { stats: { notesCount: 0, tagsCount: 0 } }
          }
        } catch (err) {
          console.error(`Error fetching stats for user ${user._id}:`, err)
          userStats.value[user._id] = { stats: { notesCount: 0, tagsCount: 0 } }
        }
      }
    }
    
    // Navigate to individual user detail page
    const navigateToUser = (user) => {
      router.push(`/admin/users/${user._id}`)
    }
    
    // Open modal to edit a user
    const editUser = (user) => {
      currentUser.value = { ...user }
      showUserEditModal.value = true
    }
    
    // Close the user edit modal
    const closeUserEditModal = () => {
      showUserEditModal.value = false
      currentUser.value = {}
    }
    
    // Handle user update event from modal
    const handleUserUpdate = async (userData) => {
      // Refresh users list
      await fetchUsers()
      // Close modal
      closeUserEditModal()
      // Show success message
      showSuccessAlert('User updated successfully!')
    }
    
    // Show confirmation dialog before deleting user
    const confirmDeleteUser = (user) => {
      Swal.fire({
        title: 'Delete User',
        text: `Are you sure you want to delete "${user.name}" (${user.email})? This action cannot be undone and will remove all their notes and tags.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete user',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteUserById(user._id)
        }
      })
    }
    
    // Delete a user by ID
    const deleteUserById = async (userId) => {
      try {
        isLoading.value = true
        error.value = null
        
        const response = await deleteUser(userId)
        
        if (response.success) {
          // Remove from local users array
          users.value = users.value.filter(u => u._id !== userId)
          
          isLoading.value = false
          showSuccessAlert('User deleted successfully!')
        } else {
          throw new Error(response.error || 'Failed to delete user')
        }
      } catch (err) {
        console.error('Error deleting user:', err)
        error.value = 'Failed to delete user'
        isLoading.value = false
        showErrorAlert('Failed to delete user. Please try again.')
      }
    }

    // Perform search with debounce to avoid excessive API calls
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
      
      // Show loading state during search
      isLoading.value = true
      
      // Set a short debounce to avoid excessive API calls while typing
      searchDebounceTimeout.value = setTimeout(async () => {
        try {
          isSearchActive.value = true
          const response = await searchUsers(searchQuery.value)
          
          if (response.success) {
            searchResults.value = response.data || []
            
            // Fetch stats for search results
            for (const user of searchResults.value) {
              try {
                const statResponse = await getUserStats(user._id)
                if (statResponse.success) {
                  userStats.value[user._id] = statResponse.data
                } else {
                  userStats.value[user._id] = { stats: { notesCount: 0, tagsCount: 0 } }
                }
              } catch (err) {
                console.error(`Error fetching stats for user ${user._id}:`, err)
                userStats.value[user._id] = { stats: { notesCount: 0, tagsCount: 0 } }
              }
            }
          } else {
            throw new Error(response.error || 'Search failed')
          }
        } catch (err) {
          console.error('Error searching users:', err)
          searchResults.value = []
          showErrorAlert('Error searching users. Please try again.')
        } finally {
          isLoading.value = false
        }
      }, 300) // 300ms debounce
    }
    
    // Clear search and reset to showing all users
    const clearSearch = () => {
      searchQuery.value = ''
      isSearchActive.value = false
      searchResults.value = []
    }

    // Watch for changes to users list (after creating, updating, deleting)
    watch(users, () => {
      // If search is active, refresh search results
      if (isSearchActive.value && searchQuery.value) {
        performSearch()
      }
    })
    
    // Fetch all users when component mounts
    onMounted(() => {
      fetchUsers()
    })
    
    return {
      users,
      userStats,
      isLoading,
      error,
      showUserEditModal,
      currentUser,
      searchQuery,
      isSearchActive,
      filteredUsers,
      nonAdminFilteredUsers,
      getUserInitials,
      fetchUsers,
      navigateToUser,
      editUser,
      closeUserEditModal,
      handleUserUpdate,
      confirmDeleteUser,
      deleteUserById,
      performSearch,
      clearSearch
    }
  }
}
</script>

<style scoped>
.users-page {
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

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.user-card {
  background-color: var(--background-alt);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.user-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.user-info {
  display: flex;
  align-items: flex-start;
  max-width: calc(100% - 80px); /* Reserve space for action buttons */
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
  margin-right: 12px;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0; /* For proper text truncation */
  overflow: hidden; /* Prevent content from overflowing */
  margin-right: 8px;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  margin: 0;
  font-size: 14px;
  color: var(--secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.badge-admin {
  display: inline-block;
  background-color: #8B5CF6;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  margin-top: 4px;
}

.badge-user {
  display: inline-block;
  background-color: #4CAF50; /* A green color for users */
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  margin-top: 4px;
}

.user-stats {
  display: flex;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 14px;
  color: var(--secondary);
}

.stats-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.stats-item i {
  margin-right: 5px;
  font-size: 16px;
}

.user-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0; /* Prevent buttons from shrinking */
  margin-left: auto;
}

.user-actions button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  background-color: transparent;
  flex-shrink: 0; /* Prevent buttons from shrinking */
}

.user-actions button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.edit-btn {
  color: var(--accent);
}

.delete-btn {
  color: #dc3545;
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

.empty-state,
.empty-search-results {
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

.empty-state h3,
.empty-search-results h3 {
  margin-bottom: 8px;
  color: var(--primary);
}

@media screen and (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
  }
}
</style> 
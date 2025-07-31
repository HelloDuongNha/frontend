import axios from 'axios'

// const API_URL = 'https://notetaking-1fu7.onrender.com'
const API_URL = 'http://localhost:3001'

// Create axios instance with error handling and timeout
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 seconds timeout
  validateStatus: status => {
    // Consider all status codes in the 200-299 range as valid
    return status >= 200 && status < 300;
  }
})

// Add response interceptor to handle common error patterns
api.interceptors.response.use(
  response => {
    // Ensure the response data always has a consistent format
    if (!response.data) {
      response.data = {}; // Always provide a data object
    }
    return response;
  },
  error => {
    // Handle connection/timeout errors
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Network Error or Timeout:', error.message);
      // Return a custom error for frontend handling
      return Promise.reject({
        isNetworkError: true,
        message: 'Connection failed. Please check your network.'
      });
    }
    
    // Handle specific error cases if needed
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.status, error.response.data);
      
      // Format errors for better display in the frontend
      const errorMessage = 
        (typeof error.response.data === 'string') ? error.response.data : 
        (error.response.data && error.response.data.message) ? error.response.data.message :
        `Error ${error.response.status}: ${error.message}`;
      
      return Promise.reject({
        status: error.response.status,
        message: errorMessage,
        data: error.response.data
      });
    } 
    
    // Other errors
    console.error('API Error:', error.message);
    return Promise.reject({
      message: error.message
    });
  }
);

// Authentication functions
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/api/users/login', {
      email,
      passwordHash: password // Note: In production, we should hash this client-side
    });
    
    // Check if the user needs to verify email first
    if (response.data && response.data.requiresVerification) {
      return {
        success: false,
        requiresVerification: true,
        userId: response.data.userId,
        message: response.data.message
      };
    }
    
    if (response.data && response.data.user && response.data.user._id) {
      // Store user data in localStorage
      localStorage.setItem('userId', response.data.user._id);
      localStorage.setItem('userName', response.data.user.name || '');
      localStorage.setItem('userEmail', response.data.user.email || '');
      localStorage.setItem('userRole', response.data.user.role || 'user'); // Save user role
      localStorage.setItem('isLoggedIn', 'true');
      
      return {
        success: true,
        user: response.data.user
      };
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Failed to login'
    };
  }
};

// Step 1 of registration - initiate with email
export const initiateRegister = async (email, name = '') => {
  try {
    const response = await api.post('/api/users/register', {
      email,
      name
    });
    
    return {
      success: true,
      userId: response.data.userId,
      isNewUser: response.data.isNewUser,
      message: response.data.message
    };
  } catch (error) {
    console.error('Registration initiation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to start registration'
    };
  }
};

// Step 2 of registration - verify OTP and complete registration
export const verifyAndCompleteRegistration = async (userId, otp, password, name) => {
  try {
    const response = await api.post('/api/users/verify-register', {
      userId,
      otp,
      password,
      name
    });
    
    return {
      success: true,
      message: response.data.message,
      user: response.data.user
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify OTP'
    };
  }
};

// Resend OTP for registration
export const resendOTP = async (userId) => {
  try {
    const response = await api.post('/api/users/resend-otp', {
      userId
    });
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      error: error.message || 'Failed to resend OTP'
    };
  }
};

// Verify email with OTP
export const verifyEmail = async (userId, otp) => {
  try {
    const response = await api.post('/api/users/verify-email', {
      userId,
      otp
    });
    
    if (response.data && response.data.user) {
      return {
        success: true,
        user: response.data.user
      };
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify email'
    };
  }
};

// Initiate forgot password
export const initiateForgotPassword = async (email) => {
  try {
    const response = await api.post('/api/users/forgot-password', {
      email
    });
    
    return {
      success: true,
      userId: response.data.userId,
      message: response.data.message
    };
  } catch (error) {
    console.error('Forgot password initiation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process forgot password request'
    };
  }
};

// Reset password with OTP
export const resetPassword = async (userId, otp, newPassword) => {
  try {
    const response = await api.post('/api/users/reset-password', {
      userId,
      otp,
      newPassword
    });
    
    return {
      success: true,
      message: response.data.message,
      email: response.data.email
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error.message || 'Failed to reset password'
    };
  }
};

// Update user profile information
export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData);
    
    if (response.data) {
      // Update local storage with new data
      if (userData.name) {
        localStorage.setItem('userName', userData.name);
      }
      
      if (userData.email) {
        localStorage.setItem('userEmail', userData.email);
      }
      
      return {
        success: true,
        user: response.data
      };
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update profile'
    };
  }
};

// Change user password
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  try {
    const response = await api.patch(`/api/users/${userId}/password`, {
      currentPassword,
      newPassword
    });
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Password change error:', error);
    return {
      success: false,
      error: error.message || 'Failed to change password'
    };
  }
};

// Send confirmation email after profile changes
export const sendProfileUpdateEmail = async (type, email, name = '') => {
  try {
    const response = await api.post('/api/users/send-notification', {
      type, // 'password', 'email', or 'name'
      email,
      name
    });
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Email notification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification email'
    };
  }
};

// Initiate email change - send OTP to new email
export const initiateEmailChange = async (userId, newEmail) => {
  try {
    const response = await api.post('/api/users/initiate-email-change', {
      userId,
      newEmail
    });
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    console.error('Email change initiation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate email change'
    };
  }
};

// Verify email change with OTP
export const verifyEmailChange = async (userId, otp, newEmail) => {
  try {
    const response = await api.post('/api/users/verify-email-change', {
      userId,
      otp,
      newEmail
    });
    
    if (response.data) {
      // Update local storage with new email
      localStorage.setItem('userEmail', newEmail);
      
      return {
        success: true,
        message: response.data.message
      };
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Email change verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify email change'
    };
  }
};

export const registerUser = async (name, email, password) => {
  try {
    // First initiate registration to get OTP sent
    const initResponse = await initiateRegister(email, name);
    
    if (!initResponse.success) {
      throw new Error(initResponse.error);
    }
    
    // Since this is a legacy function, we return this format for compatibility
    return {
      success: true,
      needsOTP: true,
      userId: initResponse.userId,
      message: initResponse.message
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Failed to register'
    };
  }
};

export const logoutUser = () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole'); // Remove user role on logout
  localStorage.removeItem('isLoggedIn');
};

export const isUserLoggedIn = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

// Helper function to get current user ID
export const getUserId = () => {
  // Get user ID from localStorage
  const storedUserId = localStorage.getItem('userId');
  
  if (!storedUserId) {
    console.warn('No user ID found in localStorage. User might need to log in.');
    // Return null instead of DEFAULT_USER_ID
    return null;
  }
  
  return storedUserId;
}

// Notes API
export const getNotes = (userId = getUserId()) => {
  // Check if userId is available
  if (!userId) {
    console.error('User ID is required but not available');
    return Promise.resolve({ data: [] });
  }
  
  return api.get(`/api/notes/user?userId=${userId}`)
    .catch(err => {
      console.error('Error fetching notes:', err);
      // Return empty array to avoid UI crashes
      return { data: [] };
    });
}

export const getTrashedNotes = (userId = getUserId()) => {
  if (!userId) {
    console.error('User ID is required but not available');
    return Promise.resolve({ data: [] });
  }
  
  return api.get(`/api/notes/trash?userId=${userId}`)
    .catch(err => {
      console.error('Error fetching trashed notes:', err);
      return { data: [] };
    });
}

export const createNote = (noteData) => {
  // Get userId from params or localStorage
  const userId = noteData.userId || getUserId();
  
  if (!userId) {
    console.error('User ID is required but not available');
    return Promise.reject(new Error('User ID is required'));
  }
  
  // Ensure userId is included
  const completeData = {
    ...noteData,
    userId
  };
  
  return api.post('/api/notes', completeData);
}

export const updateNote = (id, noteData) => {
  // Ensure userId is included if not already present
  const completeData = {
    ...noteData,
    userId: noteData.userId || getUserId()
  };
  return api.put(`/api/notes/${id}`, completeData);
}

export const deleteNote = (id) => {
  return api.delete(`/api/notes/${id}`);
}

export const moveToTrash = (id) => {
  return api.put(`/api/notes/${id}/trash`);
}

export const restoreFromTrash = (id) => {
  return api.put(`/api/notes/${id}/restore`);
}

export const toggleNoteDone = (id, isDone) => {
  return api.patch(`/api/notes/${id}/done`, { done: isDone });
}

export const searchNotes = (query, userId = getUserId()) => {
  if (!userId) {
    console.error('User ID is required but not available');
    return Promise.resolve({ data: [] });
  }
  return api.get(`/api/notes/search?keyword=${encodeURIComponent(query)}&userId=${userId}`)
    .catch(err => {
      console.error('Error searching notes:', err);
      return { data: [] };
    });
}

export const searchTrashedNotes = (query, userId = getUserId()) => {
  if (!userId) {
    console.error('User ID is required but not available');
    return Promise.resolve({ data: [] });
  }
  return api.get(`/api/notes/trash/search?keyword=${encodeURIComponent(query)}&userId=${userId}`)
    .catch(err => {
      console.error('Error searching trashed notes:', err);
      return { data: [] };
    });
}

// Tags API
export const getTags = (userId = getUserId()) => {
  if (!userId) {
    console.error('User ID is required but not available');
    return Promise.resolve({ data: [] });
  }
  
  return api.get(`/api/tags?userId=${userId}`)
    .catch(err => {
      console.error('Error fetching tags:', err);
      // Return empty array to avoid UI crashes
      return { data: [] };
    });
}

export const getTagById = (id) => {
  const userId = getUserId();
  const userRole = localStorage.getItem('userRole') || 'user';
  
  if (!userId) {
    console.error('User ID is required but not available');
    return Promise.reject(new Error('User ID is required'));
  }
  
  return api.get(`/api/tags/${id}?userId=${userId}&userRole=${userRole}`);
}

export const createTag = (tagData) => {
  // Ensure userId is included
  const completeTagData = {
    ...tagData,
    userId: tagData.userId || getUserId()
  };
  return api.post('/api/tags', completeTagData);
}

export const updateTag = (id, tagData) => {
  return api.put(`/api/tags/${id}`, tagData);
}

export const deleteTag = (id) => {
  return api.delete(`/api/tags/${id}`);
}

export const getNotesByTag = (tagId, userId = getUserId()) => {
  // Ensure userId is always included and not undefined
  const userIdToUse = userId || getUserId();
  const userRole = localStorage.getItem('userRole') || 'user';
  
  if (!userIdToUse) {
    console.error('User ID is required but not available');
    return Promise.resolve({ data: [] });
  }
  
  return api.get(`/api/tags/${tagId}/notes?userId=${userIdToUse}&userRole=${userRole}`)
    .catch(err => {
      console.error('Error fetching notes by tag:', err);
      return { data: [] };
    });
}

export const searchTags = (query, userId = getUserId()) => {
  if (!userId) {
    console.error('User ID is required but not available');
    return Promise.resolve({ data: [] });
  }
  return api.get(`/api/tags/search?query=${encodeURIComponent(query)}&userId=${userId}`)
    .catch(err => {
      console.error('Error searching tags:', err);
      return { data: [] };
    });
}

// Admin User Management API
export const getAllUsers = async () => {
  try {
    const response = await api.get('/api/users');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch users'
    };
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user'
    };
  }
};

export const deleteUser = async (userId) => {
  try {
    // Get the admin user information for notification purposes
    const adminId = getUserId();
    const adminName = localStorage.getItem('userName') || 'Administrator';
    
    // First, delete all notes and tags for this user
    // We'll use the dedicated endpoint that handles cascading deletion
    const response = await api.delete(`/api/users/${userId}?cascade=true&adminId=${adminId}&adminName=${encodeURIComponent(adminName)}`);
    
    return {
      success: true,
      message: response.data.message || 'User deleted successfully'
    };
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete user'
    };
  }
};

export const getUserStats = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}/stats`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching stats for user ${userId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user stats'
    };
  }
};

export const updateUserAdmin = async (userId, userData, adminInfo = {}) => {
  try {
    const adminName = adminInfo.adminName || localStorage.getItem('userName') || 'Administrator';
    
    // Append admin info as query params
    const url = `/api/users/${userId}?adminName=${encodeURIComponent(adminName)}`;
    
    // Use the correct endpoint that exists in the backend
    const response = await api.put(url, userData);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to update user'
    };
  }
};

export const searchUsers = async (query) => {
  try {
    const response = await api.get(`/api/users/search?keyword=${encodeURIComponent(query)}`);
    return {
      success: true,
      data: response.data || []
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      error: error.message || 'Failed to search users',
      data: []
    };
  }
};

export default api 
import axios from 'axios'

const API_URL = 'http://localhost:3000'

// Create axios instance with error handling and timeout
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 seconds timeout
  validateStatus: status => {
    // Coi tất cả các status code như thành công (200-299) là hợp lệ
    return status >= 200 && status < 300;
  }
})

// Add response interceptor to handle common error patterns
api.interceptors.response.use(
  response => {
    // Đảm bảo dữ liệu trả về luôn có định dạng nhất quán
    if (!response.data) {
      response.data = {}; // Đảm bảo luôn có data object
    }
    return response;
  },
  error => {
    // Xử lý trường hợp lỗi kết nối/timeout
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Network Error or Timeout:', error.message);
      // Trả về lỗi custom cho frontend xử lý
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
      
      // Format lỗi để frontend dễ hiển thị
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
    
    // Các lỗi khác
    console.error('API Error:', error.message);
    return Promise.reject({
      message: error.message
    });
  }
);

// Default user ID for development (used as fallback when no user is logged in)
const DEFAULT_USER_ID = '68808487bde0ccb4804aa6a6'

// Authentication functions
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/api/users/login', {
      email,
      passwordHash: password // Note: In production, we should hash this client-side
    });
    
    if (response.data && response.data.user && response.data.user._id) {
      // Store user data in localStorage
      localStorage.setItem('userId', response.data.user._id);
      localStorage.setItem('userName', response.data.user.name || '');
      localStorage.setItem('userEmail', response.data.user.email || '');
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

export const registerUser = async (name, email, password) => {
  try {
    const response = await api.post('/api/users/register', {
      name,
      email,
      passwordHash: password // Note: In production, we should hash this client-side
    });
    
    if (response.data && response.data._id) {
      // Automatically log in the user after registration
      localStorage.setItem('userId', response.data._id);
      localStorage.setItem('userName', response.data.name || '');
      localStorage.setItem('userEmail', response.data.email || '');
      localStorage.setItem('isLoggedIn', 'true');
      
      return {
        success: true,
        user: response.data
      };
    } else {
      throw new Error('Invalid response format from server');
    }
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
  localStorage.removeItem('isLoggedIn');
};

export const isUserLoggedIn = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

// Helper function to get current user ID
export const getUserId = () => {
  // Check localStorage first
  const storedUserId = localStorage.getItem('userId');
  
  // If we have a user ID in localStorage, use that
  if (storedUserId) {
    return storedUserId;
  }
  
  // Otherwise fall back to the default ID
  // In a production app, we might redirect to login instead
  return DEFAULT_USER_ID;
}

// Notes API
export const getNotes = (userId = getUserId()) => {
  return api.get(`/api/notes/user?userId=${userId}`)
    .catch(err => {
      console.error('Error fetching notes:', err);
      // Trả về mảng rỗng để không làm crash UI
      return { data: [] };
    });
}

export const getTrashedNotes = (userId = getUserId()) => {
  return api.get(`/api/notes/trash?userId=${userId}`)
    .catch(err => {
      console.error('Error fetching trashed notes:', err);
      return { data: [] };
    });
}

export const createNote = (noteData) => {
  // Ensure userId is included
  const completeData = {
    ...noteData,
    userId: noteData.userId || getUserId()
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
  return api.get(`/api/notes/search?keyword=${encodeURIComponent(query)}&userId=${userId}`)
    .catch(err => {
      console.error('Error searching notes:', err);
      return { data: [] };
    });
}

export const searchTrashedNotes = (query, userId = getUserId()) => {
  return api.get(`/api/notes/trash/search?keyword=${encodeURIComponent(query)}&userId=${userId}`)
    .catch(err => {
      console.error('Error searching trashed notes:', err);
      return { data: [] };
    });
}

// Tags API
export const getTags = (userId = getUserId()) => {
  return api.get(`/api/tags?userId=${userId}`)
    .catch(err => {
      console.error('Error fetching tags:', err);
      // Trả về mảng rỗng để không làm crash UI
      return { data: [] };
    });
}

export const getTagById = (id) => {
  const userId = getUserId();
  return api.get(`/api/tags/${id}?userId=${userId}`);
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
  const userIdToUse = userId || '68808487bde0ccb4804aa6a6';
  
  return api.get(`/api/tags/${tagId}/notes?userId=${userIdToUse}`)
    .catch(err => {
      console.error('Error fetching notes by tag:', err);
      return { data: [] };
    });
}

export const searchTags = (query, userId = getUserId()) => {
  return api.get(`/api/tags/search?query=${encodeURIComponent(query)}&userId=${userId}`)
    .catch(err => {
      console.error('Error searching tags:', err);
      return { data: [] };
    });
}

// Folders API (assuming we'll need to add this to the backend later)
export const getFolders = (userId = getUserId()) => {
  // This is a placeholder for now
  // We would need to implement this endpoint in the backend
  return api.get(`/folders/user?userId=${userId}`)
    .catch(() => {
      // Trả về mảng rỗng nếu endpoint chưa được triển khai
      return { data: [] };
    });
}

export default api 
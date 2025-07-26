/**
 * Format a date to display in a human-readable format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Format a date to display in Vietnamese DD/MM/YYYY format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string in DD/MM/YYYY format
 */
export const formatVietnameseDate = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('vi-VN')
}

/**
 * Format a date and time in Vietnamese format HH:mm DD/MM/YYYY 
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted datetime string
 */
export const formatVietnameseDatetime = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  const timeStr = dateObj.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
  const dateStr = dateObj.toLocaleDateString('vi-VN')
  return `${timeStr} ${dateStr}`
}

/**
 * Format a time to display in a human-readable format
 * @param {string|Date} date - The date to extract time from
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format a date to display as relative time (Today, Yesterday, etc)
 * @param {string|Date} date - The date to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  
  if (dateObj.toDateString() === now.toDateString()) {
    return 'Today'
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return formatDate(date)
  }
}

/**
 * Truncate text if it exceeds a certain length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Generate a random color for tags
 * @returns {string} HEX color code
 */
export const generateRandomColor = () => {
  // Pastel colors for tags
  const colors = [
    '#FFD6A5', // peach
    '#FDFFB6', // yellow
    '#CAFFBF', // green
    '#9BF6FF', // blue
    '#BDB2FF', // purple
    '#FFC6FF', // pink
    '#FFFFFC'  // white
  ]
  return colors[Math.floor(Math.random() * colors.length)]
} 
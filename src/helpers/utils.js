/**
 * Format a date to display in a human-readable format

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
 * Format a date to display in DD/MM/YYYY format
 */
export const formatLocalDate = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('vi-VN')
}

/**
 * Format a date and time in HH:mm DD/MM/YYYY format
 */
export const formatLocalDatetime = (date) => {
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
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Generate a random color for tags
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
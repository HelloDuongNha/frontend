<template>
  <div class="calendar-page">
    <div class="section-header">
      <h2 class="section-title">Calendar</h2>
      <div class="calendar-navigation">
        <button class="nav-button" @click="previousMonth">
          <span class="nav-icon">◀</span>
        </button>
        <span class="current-date">{{ currentMonthDisplay }}</span>
        <button class="nav-button" @click="nextMonth">
          <span class="nav-icon">▶</span>
        </button>
      </div>
    </div>
    
    <!-- Calendar Header -->
    <div class="calendar">
      <div class="calendar-header">
        <div v-for="day in daysOfWeek" :key="day" class="calendar-day-header">
          {{ day }}
        </div>
      </div>
      
      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index" 
          :class="[
            'calendar-day', 
            { 'current-month': day.currentMonth },
            { 'today': day.isToday },
            { 'has-notes': day.notes.length > 0 },
            { 'selected': isSelectedDay(day) }
          ]"
          @click="selectDay(day)"
        >
          <div class="day-number">{{ day.date }}</div>
          <div v-if="day.notes.length > 0" class="day-notes-indicator">
            <span class="notes-count">{{ day.notes.length }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Selected Day Notes -->
    <div v-if="selectedDay && selectedDay.notes.length > 0" class="selected-day-notes">
      <h3 class="selected-day-title">Notes for {{ selectedDayDisplay }}</h3>
      <div class="notes-list">
        <NoteCard 
          v-for="note in selectedDay.notes" 
          :key="note.id"
          :note="note"
          :allTags="tags"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getNotes, getTags } from '../helpers/api'
import NoteCard from '../components/NoteCard.vue'

export default {
  name: 'Calendar',
  components: {
    NoteCard
  },
  setup() {
    // State management
    const currentDate = ref(new Date())
    const selectedDay = ref(null)
    const notes = ref([])
    const tags = ref([])
    
    // Days of week header labels
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Format current month and year for display
    const currentMonthDisplay = computed(() => {
      return currentDate.value.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    })
    
    // Format selected day for display
    const selectedDayDisplay = computed(() => {
      if (!selectedDay.value) return ''
      
      // Create date object from selected day and current month/year
      const date = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth(),
        selectedDay.value.date
      )
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    })
    
    // Generate calendar days grid for current month view
    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      
      // Get first day of the month and total days in month
      const firstDayOfMonth = new Date(year, month, 1)
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      
      // Determine day of week for first day (0 = Sunday)
      const dayOfWeek = firstDayOfMonth.getDay()
      
      const days = []
      
      // Add days from previous month to fill first week
      const prevMonthDays = new Date(year, month, 0).getDate()
      for (let i = dayOfWeek - 1; i >= 0; i--) {
        days.push({
          date: prevMonthDays - i,
          currentMonth: false,
          isToday: false,
          notes: [] // Empty for previous month days
        })
      }
      
      // Add days from current month with notes
      const today = new Date()
      for (let i = 1; i <= daysInMonth; i++) {
        // Check if this day is today
        const isToday = 
          today.getDate() === i && 
          today.getMonth() === month &&
          today.getFullYear() === year
          
        // Find notes created on this day
        const dayNotes = notes.value.filter(note => {
          const noteDate = new Date(note.createdAt)
          return (
            noteDate.getDate() === i &&
            noteDate.getMonth() === month &&
            noteDate.getFullYear() === year
          )
        })
        
        days.push({
          date: i,
          currentMonth: true,
          isToday,
          notes: dayNotes
        })
      }
      
      // Add days from next month to complete the grid (6 rows of 7 days)
      const remainingDays = 42 - days.length
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: i,
          currentMonth: false,
          isToday: false,
          notes: [] // Empty for next month days
        })
      }
      
      return days
    })
    
    // Navigate to previous month
    const previousMonth = () => {
      currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() - 1,
        1
      )
      selectedDay.value = null // Clear selection when changing months
    }
    
    // Navigate to next month
    const nextMonth = () => {
      currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() + 1,
        1
      )
      selectedDay.value = null // Clear selection when changing months
    }
    
    // Select a day in the calendar
    const selectDay = (day) => {
      if (day.currentMonth) {
        selectedDay.value = day
      }
    }

    // Check if a day is currently selected
    const isSelectedDay = (day) => {
      return selectedDay.value && 
             day.date === selectedDay.value.date && 
             day.currentMonth === selectedDay.value.currentMonth
    }
    
    // Fetch notes from API or use fallback data
    const fetchNotes = async () => {
      try {
        const response = await getNotes()
        notes.value = response.data || []
      } catch (error) {
        console.error('Error fetching notes:', error)
        // Fallback data for development
        notes.value = [
          {
            id: 1,
            title: 'Mid test exam',
            content: 'Ultrices viverra odio congue lecos felis. libero',
            createdAt: '2021-12-12T10:30:00Z',
            updatedAt: '2021-12-12T10:30:00Z',
            color: 'var(--folder-yellow)'
          },
          {
            id: 2,
            title: 'Team Meeting',
            content: 'Discuss quarterly goals and project timeline',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            color: 'var(--folder-pink)'
          }
        ]
      }
    }
    
    // Fetch tags for note rendering
    const fetchTags = async () => {
      try {
        const response = await getTags()
        tags.value = response.data || []
      } catch (error) {
        console.error('Error fetching tags:', error)
        tags.value = [] // Default empty array
      }
    }
    
    // Initialize data when component mounts
    onMounted(() => {
      fetchNotes()
      fetchTags()
    })
    
    return {
      currentDate,
      daysOfWeek,
      calendarDays,
      currentMonthDisplay,
      selectedDay,
      selectedDayDisplay,
      previousMonth,
      nextMonth,
      selectDay,
      isSelectedDay,
      tags
    }
  }
}
</script>

<style scoped>
.calendar-page {
  max-width: 1000px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-navigation {
  display: flex;
  align-items: center;
}

.nav-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.current-date {
  margin: 0 12px;
  font-size: 16px;
  font-weight: 500;
}

.calendar {
  background-color: var(--background-alt);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 24px;
  width: 100%;
  position: relative;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: var(--accent);
  color: white;
}

.calendar-day-header {
  padding: 12px;
  text-align: center;
  font-weight: 500;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(100px, auto);
  border-top: 1px solid var(--border);
}

.calendar-day {
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 8px;
  position: relative;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.calendar-day:hover:not(.today) {
  background-color: rgba(0, 0, 128, 0.1); /* Light navy blue for hover */
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day.current-month {
  background-color: white;
}

.calendar-day.today {
  background-color: #e6f7ff;
}

.calendar-day.selected:not(.today) {
  background-color: rgba(0, 0, 128, 0.2); /* Slightly darker navy blue for selected */
}

.day-number {
  font-weight: 500;
}

.day-notes-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: var(--accent);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.selected-day-title {
  margin-bottom: 16px;
}

.notes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

@media screen and (max-width: 768px) {
  .calendar-day {
    min-height: 60px;
  }
  
  .notes-list {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style> 
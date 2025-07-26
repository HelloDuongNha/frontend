<template>
  <div class="note-card" :class="{ 'done': note.done }" :style="{ backgroundColor: note.color || '#fff' }">
    <div class="note-header">
      <h3 class="note-title">{{ note.title }}</h3>
      <div class="note-actions">
        <div class="action-menu" v-if="showActions">
          <button @click.stop="onEdit" class="menu-item">Edit</button>
          <button 
            @click.stop="toggleDoneStatus" 
            class="menu-item done-toggle"
          >
            {{ note.done ? 'Mark as Undone' : 'Mark as Done' }}
          </button>
          <button @click.stop="confirmDelete" class="menu-item delete">Delete</button>
        </div>
        <button class="action-button" @click.stop="showActions = !showActions">⋮</button>
      </div>
    </div>
    
    <div class="note-content">
      <p>{{ truncatedContent }}</p>
    </div>
    
    <div class="note-tags" v-if="noteTags.length > 0">
      <TagBadge v-for="tag in noteTags" :key="tag._id" :tag="tag" />
    </div>
    
    <div class="note-footer">
      <div class="note-time">
        <span class="time-icon">🕒</span>
        <span>{{ formattedTime }}</span>
      </div>
      <div class="updated-info" v-if="note.updatedAt && isNoteUpdated">
        <span class="updated-icon">🔄</span>
        <span class="updated-text">{{ formattedUpdatedAt }}</span>
      </div>
      <div class="note-date" v-else>{{ formattedDate }}</div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { formatTime, truncateText, formatVietnameseDate, formatVietnameseDatetime } from '../helpers/utils'
import TagBadge from './TagBadge.vue'
import Swal from 'sweetalert2'

export default {
  name: 'NoteCard',
  components: {
    TagBadge
  },
  props: {
    note: {
      type: Object,
      required: true
    },
    allTags: {
      type: Array,
      default: () => []
    }
  },
  emits: ['edit', 'delete', 'trash', 'toggle-done'],
  setup(props, { emit }) {
    const showActions = ref(false)
    
    const truncatedContent = computed(() => {
      return truncateText(props.note.content, 50)
    })
    
    const formattedTime = computed(() => {
      return formatTime(props.note.createdAt)
    })
    
    const formattedDate = computed(() => {
      return formatVietnameseDate(props.note.createdAt)
    })
    
    const formattedUpdatedAt = computed(() => {
      return formatVietnameseDatetime(props.note.updatedAt)
    })
    
    // Check if the note has been updated after creation
    const isNoteUpdated = computed(() => {
      if (!props.note.createdAt || !props.note.updatedAt) return false
      
      const createdAt = new Date(props.note.createdAt).getTime()
      const updatedAt = new Date(props.note.updatedAt).getTime()
      
      // Consider it updated if the difference is more than 1 minute (to account for initial creation)
      return updatedAt > createdAt + 60000
    })
    
    // Find tag objects that match IDs in the note's tags array
    const noteTags = computed(() => {
      // If there are no tags in the note or no tags fetched, return empty array
      if (!props.note.tags || !Array.isArray(props.note.tags) || !props.allTags || !props.allTags.length) {
        return []
      }
      
      // Ensure we're working with tag IDs as strings for consistent comparison
      const noteTagIds = props.note.tags.map(tag => 
        typeof tag === 'object' ? tag._id : String(tag)
      )
      
      // Match each tag in allTags if its ID is in the note's tags array
      const matchedTags = props.allTags.filter(tag => 
        noteTagIds.includes(tag._id) || noteTagIds.includes(String(tag._id))
      )
      
      return matchedTags
    })
    
    const onEdit = () => {
      emit('edit', props.note)
      showActions.value = false
    }
    
    const toggleDoneStatus = () => {
      emit('toggle-done', props.note)
      showActions.value = false
    }
    
    const confirmDelete = () => {
      Swal.fire({
        title: 'Move to Trash?',
        text: `Are you sure you want to move "${props.note.title}" to trash?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, move to trash',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          emit('trash', props.note._id)
        }
      })
      
      showActions.value = false
    }
    
    return {
      truncatedContent,
      formattedTime,
      formattedDate,
      formattedUpdatedAt,
      isNoteUpdated,
      noteTags,
      showActions,
      onEdit,
      toggleDoneStatus,
      confirmDelete
    }
  }
}
</script>

<style scoped>
.note-card {
  border-radius: var(--radius-md);
  background-color: var(--background-alt);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  height: 200px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  position: relative;
}

.note-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.note-card.done {
  opacity: 0.7;
}

.note-card.done::after {
  content: '✓';
  position: absolute;
  top: -10px;
  right: -10px;
  width: 25px;
  height: 25px;
  background-color: var(--accent);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.note-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.note-actions {
  position: relative;
}

.action-button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  z-index: 5;
  width: 160px;
  overflow: hidden;
}

.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item.done-toggle {
  color: #28a745;
}

.menu-item.done-toggle:hover {
  background-color: #e8f5e9;
}

.menu-item.delete {
  color: #f44336;
}

.menu-item.delete:hover {
  background-color: #ffebee;
}

.note-content {
  flex: 1;
  font-size: 14px;
  color: var(--secondary);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  margin: 8px 0;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 12px;
}

.note-time {
  display: flex;
  align-items: center;
  color: var(--secondary);
}

.time-icon, .updated-icon {
  margin-right: 4px;
  font-size: 10px;
}

.note-date, .updated-info {
  color: var(--secondary);
  display: flex;
  align-items: center;
}

.updated-text {
  font-size: 11px;
  color: var(--accent);
}
</style> 
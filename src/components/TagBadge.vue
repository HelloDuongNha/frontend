<template>
  <div class="tag-badge" :style="{ backgroundColor: tagColor }">
    {{ tagName }}
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'TagBadge',
  props: {
    /**
     * Tag object containing name and color properties
     * @type {Object}
     * @property {string} name - The display name of the tag
     * @property {string} color - The color code for the tag background
     */
    tag: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    /**
     * Get tag name with fallback if undefined
     */
    const tagName = computed(() => props.tag?.name || 'Unnamed')
    
    /**
     * Get tag color with fallback if undefined
     */
    const tagColor = computed(() => props.tag?.color || '#e9ecef')
    
    return {
      tagName,
      tagColor
    }
  }
}
</script>

<style scoped>
/* Tag styling - displays as a rounded pill shape */
.tag-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-right: 4px;
  margin-bottom: 4px;
  color: #333;
  font-weight: 500;
}
</style> 
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
    tag: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const tagName = computed(() => props.tag.name)
    const tagColor = computed(() => props.tag.color)
    
    return {
      tagName,
      tagColor
    }
  }
}
</script>

<style scoped>
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
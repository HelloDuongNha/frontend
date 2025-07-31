<template>
  <header class="header">
    <div class="header-content">
      <!-- Page Title -->
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>
  </header>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'AppHeader',
  setup() {
    const route = useRoute()
    
    // Compute page title based on current route name
    const pageTitle = computed(() => {
      const routeName = route.name
      // Default to 'MY NOTES' if route is home or undefined
      if (routeName === 'Home') return 'MY NOTES'
      return routeName || 'MY NOTES'
    })

    return {
      pageTitle
    }
  }
}
</script>

<style scoped>
/* Header container */
.header {
  padding: 16px 24px;
  background-color: var(--background-alt);
  border-bottom: 1px solid var(--border);
}

/* Content layout */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Title styling */
.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
}

/* Responsive layout adjustments */
@media screen and (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-title {
    margin-bottom: 10px;
  }
}
</style> 
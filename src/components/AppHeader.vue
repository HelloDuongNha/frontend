<template>
  <header class="header">
    <div class="header-content">
      <!-- Page Title -->
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>
  </header>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'AppHeader',
  setup() {
    const route = useRoute()
    
    // Derive page title from route
    const pageTitle = computed(() => {
      const routeName = route.name
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
.header {
  padding: 16px 24px;
  background-color: var(--background-alt);
  border-bottom: 1px solid var(--border);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
}

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
<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
import ChatSidebar from '@/components/ChatSidebar.vue'
import IconSidebar from '@/components/icons/IconSidebar.vue'
import { RouterView } from 'vue-router'

const chatStore = useChatStore()
</script>

<template>
  <div class="flex w-screen h-screen overflow-hidden">
    <!-- 侧边栏 -->
    <ChatSidebar />

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col min-w-0 relative">
      <!-- 顶部栏 -->
      <header
        class="flex items-center justify-between px-4 h-[52px] border-b border-edge bg-surface shrink-0 z-10"
      >
        <div class="flex items-center gap-2.5">
          <button
            v-if="!chatStore.sidebarOpen"
            class="w-9 h-9 flex items-center justify-center rounded-[10px] text-content-dim cursor-pointer hover:text-content hover:bg-surface-hover transition-colors duration-150"
            @click="chatStore.toggleSidebar"
            title="展开侧边栏"
          >
            <IconSidebar />
          </button>
          <span class="text-[15px] font-semibold text-content">JavaChat</span>
          <span
            class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary tracking-wider"
          >
            AI
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full transition-colors duration-150"
            :class="chatStore.isGenerating ? 'bg-primary animate-pulse-dot' : 'bg-ok'"
          />
          <span class="text-[13px] text-content-muted">
            {{ chatStore.isGenerating ? '思考中...' : '在线' }}
          </span>
        </div>
      </header>

      <!-- 路由视图 -->
      <RouterView />
    </main>
  </div>
</template>

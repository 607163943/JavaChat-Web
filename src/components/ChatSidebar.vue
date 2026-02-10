<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
import IconPlus from './icons/IconPlus.vue'
import IconChat from './icons/IconChat.vue'
import IconTrash from './icons/IconTrash.vue'
import IconSidebar from './icons/IconSidebar.vue'

const chatStore = useChatStore()

function handleNewChat() {
  chatStore.createConversation()
}

function handleSelectChat(id: string) {
  chatStore.setActiveConversation(id)
}

function handleDeleteChat(e: Event, id: string) {
  e.stopPropagation()
  chatStore.deleteConversation(id)
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <aside
    class="h-screen bg-surface-sidebar border-r border-edge flex flex-col shrink-0 relative z-20 overflow-hidden transition-all duration-200"
    :class="chatStore.sidebarOpen ? 'w-[260px]' : 'w-0 border-r-0'"
  >
    <div class="w-[260px] h-full flex flex-col min-w-[260px]">
      <!-- 顶部区域 -->
      <div class="p-3 flex flex-col gap-2">
        <button
          class="w-9 h-9 flex items-center justify-center rounded-[10px] text-content-dim self-end cursor-pointer hover:text-content hover:bg-surface-hover transition-colors duration-150"
          @click="chatStore.toggleSidebar"
          title="收起侧边栏"
        >
          <IconSidebar />
        </button>
        <button
          class="flex items-center gap-2.5 w-full py-2.5 px-3.5 rounded-[10px] border border-dashed border-edge-hover text-content-dim text-sm cursor-pointer bg-transparent transition-all duration-150 hover:border-primary hover:text-primary hover:bg-primary/15"
          @click="handleNewChat"
        >
          <IconPlus />
          <span>新建对话</span>
        </button>
      </div>

      <!-- 对话列表 -->
      <div class="flex-1 overflow-y-auto px-2 py-1">
        <div
          v-if="chatStore.sortedConversations.length === 0"
          class="py-10 px-5 text-center"
        >
          <p class="text-content-muted text-sm mb-1">暂无对话</p>
          <p class="text-content-muted text-xs opacity-60">点击上方按钮开始新对话</p>
        </div>

        <div
          v-for="conv in chatStore.sortedConversations"
          :key="conv.id"
          class="group flex items-center gap-2.5 py-2.5 px-3 rounded-[10px] cursor-pointer mb-0.5 transition-all duration-150"
          :class="
            conv.id === chatStore.activeConversationId
              ? 'bg-surface-active'
              : 'hover:bg-surface-hover'
          "
          @click="handleSelectChat(conv.id)"
        >
          <div
            class="shrink-0 flex items-center"
            :class="
              conv.id === chatStore.activeConversationId
                ? 'text-primary'
                : 'text-content-muted'
            "
          >
            <IconChat />
          </div>
          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <span class="text-[13px] text-content truncate">{{ conv.title }}</span>
            <span class="text-[11px] text-content-muted">{{
              formatTime(conv.updatedAt)
            }}</span>
          </div>
          <button
            class="shrink-0 opacity-0 group-hover:opacity-100 text-content-muted p-1 rounded-md flex items-center cursor-pointer bg-transparent border-none transition-all duration-150 hover:text-danger hover:bg-danger/10"
            @click="handleDeleteChat($event, conv.id)"
            title="删除对话"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <!-- 底部品牌 -->
      <div class="p-4 border-t border-edge">
        <div class="flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center font-bold text-base text-white"
          >
            J
          </div>
          <span class="text-[15px] font-semibold text-content">JavaChat</span>
        </div>
      </div>
    </div>
  </aside>
</template>

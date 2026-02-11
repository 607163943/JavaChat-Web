<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatMessage from '@/components/ChatMessage.vue'
import ChatInput from '@/components/ChatInput.vue'
import WelcomeScreen from '@/components/WelcomeScreen.vue'

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement>()

const hasMessages = computed(() => {
  return chatStore.activeConversation && chatStore.activeConversation.messages.length > 0
})

const aiAvatar = {
  imgSrc: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="8" fill="#2563EB"/><text x="16" y="22" font-family="sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle">J</text></svg>')}`,
  width: 32,
  height: 32
}

const showGenerating = computed(() => {
  const last = chatStore.activeConversation?.messages.at(-1)
  return chatStore.isGenerating && last?.role !== 'assistant'
})

// 自动滚动到底部
watch(
  () => chatStore.activeConversation?.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

watch(
  () => chatStore.activeConversation?.messages.at(-1)?.content,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

function scrollToBottom() {
  const container = messagesContainer.value
  if (container) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col h-screen overflow-hidden bg-surface">
    <!-- 消息区域 -->
    <div v-if="hasMessages" ref="messagesContainer" class="flex-1 overflow-y-auto py-4">
      <div class="max-w-[768px] mx-auto px-4">
        <ChatMessage
          v-for="msg in chatStore.activeConversation!.messages"
          :key="msg.id"
          :message="msg"
        />

        <!-- 生成中状态 -->
        <div v-if="showGenerating" class="py-1 animate-fade-in">
          <McBubble :loading="true" :avatarConfig="aiAvatar" />
        </div>
      </div>
    </div>

    <!-- 欢迎页 -->
    <WelcomeScreen v-else />

    <!-- 输入区域 -->
    <ChatInput />
  </div>
</template>

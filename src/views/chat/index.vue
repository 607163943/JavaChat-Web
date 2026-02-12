<script setup lang="ts">
import { ref, watch, nextTick, computed, onBeforeUnmount } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatMessage from '@/components/ChatMessage.vue'
import ChatInput from '@/components/ChatInput.vue'
import WelcomeScreen from '@/components/WelcomeScreen.vue'

const chatStore = useChatStore()
const messagesContainer = ref<HTMLElement>()

/** 是否允许自动滚动（用户未主动上滑时为 true） */
const autoScroll = ref(true)
/** 标记本次滚动是否由程序触发，用于区分用户手动滚动 */
let programmaticScroll = false

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

// ── 判断是否已到底部（允许 30px 误差） ──
function isNearBottom(container: HTMLElement, threshold = 30): boolean {
  return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
}

// ── 监听用户滚动，判断是否需要锁定/解锁自动滚动 ──
function onScroll() {
  // 如果是程序触发的滚动，忽略
  if (programmaticScroll) return

  const container = messagesContainer.value
  if (!container) return

  // 用户手动滚动：如果滚到了底部附近，恢复自动滚动；否则关闭
  autoScroll.value = isNearBottom(container)
}

// 绑定 / 解绑滚动监听
watch(messagesContainer, (el, oldEl) => {
  oldEl?.removeEventListener('scroll', onScroll)
  el?.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  messagesContainer.value?.removeEventListener('scroll', onScroll)
})

// ── 滚动到底部（仅在 autoScroll 为 true 时执行） ──
function scrollToBottom(force = false) {
  const container = messagesContainer.value
  if (!container) return
  if (!force && !autoScroll.value) return

  programmaticScroll = true
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })

  // smooth 滚动是异步的，延迟一段时间后取消标记
  setTimeout(() => {
    programmaticScroll = false
  }, 500)
}

// ── 新消息条数变化（用户发送 / AI 新回复开始）→ 自动滚动 ──
watch(
  () => chatStore.activeConversation?.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

// ── AI 流式输出内容更新 → 自动滚动 ──
watch(
  () => chatStore.activeConversation?.messages.at(-1)?.content,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

// ── 用户提交时，强制滚动到底部并恢复自动滚动 ──
const handleSubmit = async () => {
  autoScroll.value = true
  await nextTick()
  scrollToBottom(true)
}

// ── 切换会话时重置滚动状态 ──
watch(
  () => chatStore.activeConversation?.id,
  async () => {
    autoScroll.value = true
    await nextTick()
    scrollToBottom(true)
  }
)
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
    <ChatInput @submit="handleSubmit" />
  </div>
</template>

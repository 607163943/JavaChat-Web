<script setup lang="ts">
import type { Message } from '@/stores/chat'

defineProps<{
  message: Message
}>()

const aiAvatarSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="8" fill="#2563EB"/><text x="16" y="22" font-family="sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle">J</text></svg>'

const userAvatarSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="8" fill="#333"/><path d="M21.3 22v-1.5a3.5 3.5 0 00-3.5-3.5h-3.6a3.5 3.5 0 00-3.5 3.5V22" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="12" r="3" stroke="white" stroke-width="1.5" fill="none"/></svg>'

const aiAvatar = {
  imgSrc: `data:image/svg+xml,${encodeURIComponent(aiAvatarSvg)}`,
  width: 32,
  height: 32,
}

const userAvatar = {
  imgSrc: `data:image/svg+xml,${encodeURIComponent(userAvatarSvg)}`,
  width: 32,
  height: 32,
}
</script>

<template>
  <div class="animate-fade-in py-1">
    <!-- 用户消息 -->
    <McBubble
      v-if="message.role === 'user'"
      :content="message.content"
      align="right"
      :avatarConfig="userAvatar"
    />

    <!-- AI 消息 — 使用 McMarkdownCard 渲染 Markdown -->
    <McBubble v-else :avatarConfig="aiAvatar">
      <McMarkdownCard :content="message.content" theme="dark" />
    </McBubble>
  </div>
</template>

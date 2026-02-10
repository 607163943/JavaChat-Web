<script setup lang="ts">
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

const logoSvg = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" rx="20" fill="#2563EB"/><text x="36" y="48" font-family="sans-serif" font-size="36" font-weight="800" fill="white" text-anchor="middle">J</text></svg>',
)}`

const featureTags = ['联网搜索', '文档解析', '图像识别', '深度研究']

const introPrompts = [
  {
    value: 'article',
    label: '帮我写一篇关于人工智能发展趋势的文章',
    iconConfig: { name: 'icon-info-o', color: '#2563EB' },
    desc: '生成一篇深度分析文章',
  },
  {
    value: 'quantum',
    label: '解释一下量子计算的基本原理',
    iconConfig: { name: 'icon-star', color: '#0EA5E9' },
    desc: '用通俗易懂的语言解释复杂概念',
  },
  {
    value: 'code',
    label: '分析这段代码的时间复杂度',
    iconConfig: { name: 'icon-priority', color: '#34D399' },
    desc: '代码分析与优化建议',
  },
  {
    value: 'productivity',
    label: '给我推荐一些提高工作效率的方法',
    iconConfig: { name: 'icon-info-o', color: '#FBBF24' },
    desc: '实用的效率提升技巧',
  },
]

function handlePromptClick(item: { label: string }) {
  chatStore.sendMessage(item.label)
}
</script>

<template>
  <div class="flex-1 flex items-center justify-center p-10 overflow-y-auto">
    <div class="max-w-[640px] w-full flex flex-col items-center gap-9 animate-fade-in">
      <!-- McIntroduction 组件 — 展示Logo/标题/副标题/描述 -->
      <McIntroduction
        :logoImg="logoSvg"
        title="JavaChat"
        subTitle="你好，我是 JavaChat"
        :description="['AI 智能助手，随时为你解答问题、创作内容、分析文件']"
      />

      <!-- 功能标签 -->
      <div class="flex gap-2.5 flex-wrap justify-center">
        <span
          v-for="tag in featureTags"
          :key="tag"
          class="px-4 py-2 rounded-full bg-surface-card border border-edge text-sm text-content-dim cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary hover:bg-primary/15"
        >
          {{ tag }}
        </span>
      </div>

      <!-- McPrompt 组件 — 快捷提问 -->
      <McPrompt
        :list="introPrompts"
        direction="horizontal"
        variant="bordered"
        class="w-full"
        @itemClick="handlePromptClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const inputValue = ref('')

// 提交消息
const emit = defineEmits(['submit'])
const handleSubmit = async (text: string) => {
  const content = typeof text === 'string' ? text.trim() : inputValue.value.trim()
  if (!content || chatStore.isGenerating) return
  inputValue.value = ''
  emit('submit', content)
  chatStore.sendMessage(content)
}

function handleChange(val: string) {
  inputValue.value = val
}

// 停止生成
function handleCancel() {
  chatStore.cancelGenerate()
}
</script>

<template>
  <div class="px-4 pb-4 w-full max-w-[800px] mx-auto">
    <McInput
      :value="inputValue"
      :maxLength="2000"
      :loading="chatStore.isGenerating"
      @change="handleChange"
      @submit="handleSubmit"
      @cancel="handleCancel"
    >
      <template #extra>
        <div class="flex items-center justify-between text-xs pt-1">
          <div class="flex items-center gap-3">
            <span
              class="flex items-center gap-1 cursor-pointer text-content-muted hover:text-content-dim transition-colors duration-150"
            >
              <i class="icon-add text-sm"></i>
              附件
            </span>
          </div>
          <span class="text-content-muted opacity-60"> JavaChat 可能会犯错，请核实重要信息 </span>
        </div>
      </template>
    </McInput>
  </div>
</template>

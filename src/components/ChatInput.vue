<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { FileItem, UploadOptions } from '@matechat/core/Attachment/attachment-types'
import type { Response } from '@/utils/request'

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

const fileList = ref<FileItem[]>([])

// 核心：配置上传参数
const uploadOptions = ref<UploadOptions>({
  uri: '/api/update-file'
})

// 监听上传成功和失败事件
const handleSuccess = (file: File, response: string) => {
  const result: Response<string> = JSON.parse(response)
  chatStore.addUploadFileId(result.data)
}
const handleError = (file: File, error: string) => {
  console.error(`文件 ${file.name} 上传失败，错误:`, error)
}

// 处理文件列表的移除事件
const handleRemove = (file: FileItem) => {
  fileList.value = fileList.value.filter((item: FileItem) => item.uid !== file.uid)
}

// 处理文件列表的重试上传事件
const handleRetryUpload = (file: FileItem) => {
  const targetFile = fileList.value.find((item: FileItem) => item.uid === file.uid)
  if (targetFile) {
    targetFile.status = 'uploading'
    targetFile.percentage = 0
  }
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
      <!-- 1. 文件列表放置在 head 插槽 -->
      <template #head>
        <McFileList
          v-if="fileList.length > 0"
          :file-items="fileList"
          context="input"
          @remove="handleRemove"
          @retry-upload="handleRetryUpload"
        />
      </template>
      <!-- 2. 附件上传器放置在 extra 插槽 -->
      <template #extra>
        <div class="flex items-center justify-between text-xs pt-1">
          <div class="flex items-center gap-3">
            <span
              class="flex items-center gap-1 cursor-pointer text-content-muted hover:text-content-dim transition-colors duration-150"
            >
              <McAttachment
                v-model="fileList"
                :draggable="false"
                :upload-options="uploadOptions"
                accept="image/*"
                :max-size="0.5"
                @success="handleSuccess"
                @error="handleError"
              >
                <i class="icon-add text-sm"></i>
                附件
              </McAttachment>
            </span>
          </div>
          <span class="text-content-muted opacity-60"> JavaChat 可能会犯错，请核实重要信息 </span>
        </div>
      </template>
    </McInput>
  </div>
</template>

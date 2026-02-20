import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import { chatMessageListService } from '@/api/chat-message'
import {
  chatConversationListService,
  chatDeleteConversationService,
  chatGetConversationIdService
} from '@/api/conversation'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import dayjs from 'dayjs'

// 消息
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  createTime: string
}

// 对话
export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createTime: string
  updateTime: string
}

export const useChatStore = defineStore('chat', () => {
  // 对话列表
  const conversations = ref<Conversation[]>([])
  // 当前激活对话id
  const activeConversationId = ref<string | null>(null)
  // 文件上传列表Id集合
  const uploadFileIds = ref<string[]>([])
  // 添加上传列表Id
  const addUploadFileId = (id: string) => {
    uploadFileIds.value.push(id)
  }
  // 移除上传列表Id
  const removeUploadFileId = (id: string) => {
    uploadFileIds.value = uploadFileIds.value.filter((item: string) => item !== id)
  }

  // 侧边栏是否打开
  const sidebarOpen = ref(true)
  // 是否正在生成
  const isGenerating = ref(false)

  // 流式请求控制器(用于中断请求)
  let currentAbortController: AbortController | null = null

  // 取消AI当前任务(中断请求)
  const cancelGenerate = () => {
    if (currentAbortController) {
      currentAbortController.abort()
      currentAbortController = null
    }
    isGenerating.value = false
  }

  // 当前激活对话
  const activeConversation = computed(() => {
    if (!activeConversationId.value) return null
    return conversations.value.find((c) => c.id === activeConversationId.value) ?? null
  })

  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => dayjs(b.updateTime).diff(dayjs(a.updateTime)))
  })

  // 加载对话列表
  const loadConversationList = async () => {
    const res = await chatConversationListService()
    // 除去message[]之外的属性填充
    conversations.value = res.data.data.map((item) => ({
      id: item.id,
      title: item.title,
      messages: [],
      createTime: item.createTime,
      updateTime: item.updateTime
    }))
  }

  // 创建对话
  const createConversation = async (): Promise<string> => {
    // 获取对话id
    const res = await chatGetConversationIdService()
    const id = res.data.data
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const conversation: Conversation = {
      id,
      title: '新对话',
      messages: [],
      createTime: now,
      updateTime: now
    }
    conversations.value.unshift(conversation)
    activeConversationId.value = id
    return id
  }

  // 设置当前激活对话
  const setActiveConversation = (id: string | null) => {
    activeConversationId.value = id
  }

  // 删除对话
  const deleteConversation = async (id: string) => {
    await chatDeleteConversationService(id)
    const index = conversations.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      if (activeConversationId.value === id) {
        activeConversationId.value = conversations.value[0]?.id ?? null
      }
    }
  }

  // 加载消息列表
  const loadMessages = async (conversationId: string) => {
    const res = await chatMessageListService(conversationId)

    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (!conversation) return
    conversation.messages = res.data.data
  }

  // 添加消息气泡
  const addMessage = (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Ref<Message> | null => {
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (!conversation) return null

    const message = ref<Message>({
      id: '',
      conversationId,
      role,
      content,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    conversation.messages.push(message.value)
    conversation.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')

    return message
  }

  // 发送用户请求消息
  const sendMessage = async (content: string) => {
    // 如果正在生成，先取消上一次（避免并发串台）
    cancelGenerate()
    let conversationId = activeConversationId.value
    if (!conversationId) {
      conversationId = await createConversation()
    }

    const userMessage = addMessage(conversationId, 'user', content)
    isGenerating.value = true

    // AI回复
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (!conversation) {
      isGenerating.value = false
      return
    }

    // 关键：先插入一条 assistant 占位消息，后续不断追加 content
    const assistantMsg = ref<Message>({
      id: '',
      conversationId,
      role: 'assistant',
      content: '',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    conversation.messages.push(assistantMsg.value)
    conversation.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')

    const ac = new AbortController()
    currentAbortController = ac

    try {
      const appendDelta = (delta: string) => {
        if (!delta) return
        conversation.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
        // 找到会话中旧聊天记录进行内容更新
        assistantMsg.value.content += delta
      }

      await fetchEventSource('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          prompt: content,
          uploadFileIds: uploadFileIds.value
        }),
        signal: ac.signal,
        // 关键：后台/切出时仍保持 SSE 连接不断流
        openWhenHidden: true,

        onmessage(ev) {
          // ev.data 就是服务端每个 SSE event 的 data 内容（通常是 JSON 字符串）
          const obj = JSON.parse(ev.data)
          if (obj.type === 'meta') {
            assistantMsg.value.id = obj.messageId
            if (userMessage) {
              userMessage.value.id = obj.userMessageId
            }
          }
          if (obj.type === 'delta') appendDelta(obj.content)
          if (obj.type === 'done') ac.abort()
        },

        onerror(err) {
          console.error(err)
        }
      })
    } catch (e: unknown) {
      // abort 属于正常取消，不提示错误
      if (e instanceof Error && e.name !== 'AbortError') {
        assistantMsg.value.content += `\n\n[请求失败] ${e?.message ?? String(e)}`
      }
    } finally {
      if (currentAbortController === ac) currentAbortController = null
      isGenerating.value = false

      // 第一轮对话完毕让AI生成总结标题
      if (conversation.messages.length === 2) {
        await createConversationTitle()
      }
    }
  }

  // 总结对话标题
  const createConversationTitle = async () => {
    // 如果正在生成，先取消上一次（避免并发串台）
    cancelGenerate()
    // 获取对话id，没有直接结束
    const conversationId = activeConversationId.value
    if (!conversationId) {
      return
    }

    // AI回复
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (!conversation) {
      return
    }

    const ac = new AbortController()
    currentAbortController = ac

    // 清空旧标题
    conversation.title = ''
    try {
      const appendDelta = (delta: string) => {
        if (!delta) return
        conversation.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
        // 找到会话中旧聊天记录进行内容更新
        conversation.title += delta
      }

      await fetchEventSource('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
        signal: ac.signal,
        // 关键：后台/切出时仍保持 SSE 连接不断流
        openWhenHidden: true,

        onmessage(ev) {
          // ev.data 就是服务端每个 SSE event 的 data 内容（通常是 JSON 字符串）
          const obj = JSON.parse(ev.data)
          if (obj.type === 'delta') appendDelta(obj.content)
          if (obj.type === 'done') ac.abort()
        },

        onerror(err) {
          console.error(err)
        }
      })
    } catch (e: unknown) {
      // abort 属于正常取消，不提示错误
      if (e instanceof Error && e.name !== 'AbortError') {
        conversation.title = '新对话'
      }
    } finally {
      if (currentAbortController === ac) currentAbortController = null
    }
  }

  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    uploadFileIds,
    addUploadFileId,
    removeUploadFileId,
    sortedConversations,
    sidebarOpen,
    isGenerating,
    loadConversationList,
    loadMessages,
    createConversation,
    setActiveConversation,
    deleteConversation,
    addMessage,
    sendMessage,
    toggleSidebar,
    cancelGenerate,
    createConversationTitle
  }
})

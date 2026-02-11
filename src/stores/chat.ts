import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { chatGetConversationIdService } from '@/api/chat'
import { fetchEventSource } from '@microsoft/fetch-event-source'

// 消息
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// 对话
export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export const useChatStore = defineStore('chat', () => {
  // 对话列表
  const conversations = ref<Conversation[]>([])
  // 当前激活对话id
  const activeConversationId = ref<string | null>(null)
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
    return [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  }

  // 创建对话
  const createConversation = async (firstMessage?: string): Promise<string> => {
    // 获取对话id
    const res = await chatGetConversationIdService()
    const id = res.data.data
    const now = Date.now()
    const conversation: Conversation = {
      id,
      title: firstMessage
        ? firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '')
        : '新对话',
      messages: [],
      createdAt: now,
      updatedAt: now
    }
    conversations.value.unshift(conversation)
    activeConversationId.value = id
    return id
  }

  function setActiveConversation(id: string) {
    activeConversationId.value = id
  }

  function deleteConversation(id: string) {
    const index = conversations.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      if (activeConversationId.value === id) {
        activeConversationId.value = conversations.value[0]?.id ?? null
      }
    }
  }

  // 添加聊天气泡
  const addMessage = (conversationId: string, role: 'user' | 'assistant', content: string) => {
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (!conversation) return

    const message: Message = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now()
    }
    conversation.messages.push(message)
    conversation.updatedAt = Date.now()

    // 更新标题（取第一条用户消息）
    if (role === 'user' && conversation.messages.filter((m) => m.role === 'user').length === 1) {
      conversation.title = content.slice(0, 30) + (content.length > 30 ? '...' : '')
    }
  }

  // 发送用户请求消息
  const sendMessage = async (content: string) => {
    // 如果正在生成，先取消上一次（避免并发串台）
    cancelGenerate()
    let conversationId = activeConversationId.value
    if (!conversationId) {
      conversationId = await createConversation(content)
    }

    addMessage(conversationId, 'user', content)
    isGenerating.value = true

    // AI回复
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (!conversation) {
      isGenerating.value = false
      return
    }

    // 关键：先插入一条 assistant 占位消息，后续不断追加 content
    const assistantMsg: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }
    conversation.messages.push(assistantMsg)
    conversation.updatedAt = Date.now()

    const ac = new AbortController()
    currentAbortController = ac

    try {
      const appendDelta = (delta: string) => {
        if (!delta) return
        conversation.updatedAt = Date.now()
        // 找到会话中旧聊天记录进行内容更新
        const messages = conversation.messages.filter((m) => m.id === assistantMsg.id)[0]
        if (messages) {
          messages.content += delta
        }
      }

      await fetchEventSource('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, prompt: content }),
        signal: ac.signal,

        onmessage(ev) {
          // ev.data 就是服务端每个 SSE event 的 data 内容（通常是 JSON 字符串）
          const obj = JSON.parse(ev.data)
          if (obj.type === 'meta') console.log(obj.messageId)
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
        assistantMsg.content += `\n\n[请求失败] ${e?.message ?? String(e)}`
      }
    } finally {
      if (currentAbortController === ac) currentAbortController = null
      isGenerating.value = false
    }
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    sortedConversations,
    sidebarOpen,
    isGenerating,
    createConversation,
    setActiveConversation,
    deleteConversation,
    addMessage,
    sendMessage,
    toggleSidebar,
    cancelGenerate
  }
})

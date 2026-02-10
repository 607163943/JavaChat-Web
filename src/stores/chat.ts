import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const activeConversationId = ref<string | null>(null)
  const sidebarOpen = ref(true)
  const isGenerating = ref(false)

  const activeConversation = computed(() => {
    if (!activeConversationId.value) return null
    return conversations.value.find((c) => c.id === activeConversationId.value) ?? null
  })

  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  }

  function createConversation(firstMessage?: string): string {
    const id = generateId()
    const now = Date.now()
    const conversation: Conversation = {
      id,
      title: firstMessage ? firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '') : '新对话',
      messages: [],
      createdAt: now,
      updatedAt: now,
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

  function addMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (!conversation) return

    const message: Message = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
    }
    conversation.messages.push(message)
    conversation.updatedAt = Date.now()

    // 更新标题（取第一条用户消息）
    if (role === 'user' && conversation.messages.filter((m) => m.role === 'user').length === 1) {
      conversation.title = content.slice(0, 30) + (content.length > 30 ? '...' : '')
    }
  }

  async function sendMessage(content: string) {
    let convId = activeConversationId.value
    if (!convId) {
      convId = createConversation(content)
    }

    addMessage(convId, 'user', content)
    isGenerating.value = true

    // 模拟 AI 回复
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    const replies = [
      '你好！我是 JavaChat 智能助手，很高兴为你服务。请问有什么我可以帮助你的吗？',
      '这是一个很好的问题！让我来为你详细分析一下...\n\n首先，我们需要了解问题的核心。这个话题涉及多个方面，我会从以下几个维度来解答：\n\n1. **基础概念**：确保我们对问题有共同的理解\n2. **深入分析**：探讨问题的本质和关键因素\n3. **实践建议**：提供可操作的解决方案\n\n希望这些信息对你有帮助！如有更多问题，随时提问。',
      '根据你的描述，我理解你想了解的是这方面的内容。\n\n以下是我的分析：\n\n> 关键要点：在处理这类问题时，最重要的是理解上下文和目标。\n\n让我用一个简单的例子来说明：\n\n```python\ndef solve_problem(context, goal):\n    analysis = analyze(context)\n    solution = generate_solution(analysis, goal)\n    return optimize(solution)\n```\n\n这个框架可以帮助你系统地思考和解决问题。还有什么需要我进一步说明的吗？',
      '当然可以！让我来帮你解答这个问题。\n\n这是一个常见的场景，有多种方法可以处理。最推荐的做法是：\n\n- ✅ 明确需求和目标\n- ✅ 选择合适的技术方案\n- ✅ 分步实施和验证\n- ✅ 持续优化和改进\n\n如果你需要更具体的指导，请告诉我更多细节，我会提供更有针对性的建议。',
    ]

    const reply = replies[Math.floor(Math.random() * replies.length)]
    addMessage(convId, 'assistant', reply)
    isGenerating.value = false
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
  }
})

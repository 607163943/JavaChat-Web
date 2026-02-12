import request from '@/utils/request'
import type { Response } from '@/utils/request'
import type { Conversation, Message } from '@/stores/chat'

// 获取会话id
export const chatGetConversationIdService = () => {
  return request.get<Response<string>>('/chat/conversation/id')
}

// 根据id删除对话
export const chatDeleteConversationService = (id: string) => {
  return request.delete<Response<void>>(`/chat/conversation/${id}`)
}

// 获取对话列表
export const chatConversationListService = () => {
  return request.get<Response<Conversation[]>>('/chat/conversation/list')
}

// 根据对话id获取消息列表
export const chatMessageListService = (conversationId: string) => {
  return request.get<Response<Message[]>>(`/chat/message/list/${conversationId}`)
}

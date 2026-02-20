import request from '@/utils/request'
import type { Response } from '@/utils/request'
import type { Message } from '@/stores/chat'

// 根据对话id获取消息列表
export const chatMessageListService = (conversationId: string) => {
  return request.get<Response<Message[]>>(`/chat-message/list/${conversationId}`)
}

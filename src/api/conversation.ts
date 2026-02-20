import request from '@/utils/request'
import type { Response } from '@/utils/request'
import type { Conversation } from '@/stores/chat'
// 获取会话id
export const chatGetConversationIdService = () => {
  return request.get<Response<string>>('/conversation/id')
}

// 根据id删除对话
export const chatDeleteConversationService = (id: string) => {
  return request.delete<Response<void>>(`/conversation/${id}`)
}

// 获取对话列表
export const chatConversationListService = () => {
  return request.get<Response<Conversation[]>>('/conversation/list')
}

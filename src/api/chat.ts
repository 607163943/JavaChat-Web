import request from '@/utils/request'
import type { Response } from '@/utils/request'

// 获取会话id
export const chatGetConversationIdService = () => {
  return request.get<Response<string>>('/chat/conversation/id')
}

import type { ApiResponse, Chat, Message } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class ChatService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem("accessToken")

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: "include",
      ...options,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Request failed")
    }

    return response.json()
  }

  async fetchChats() {
    return this.request<Chat[]>("/chat")
  }

  async accessChat(userId: string) {
    return this.request<Chat>("/chat", {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  async createGroupChat(name: string, users: string[]) {
    return this.request<Chat>("/chat/group", {
      method: "POST",
      body: JSON.stringify({ name, users }),
    })
  }

  async renameGroup(chatId: string, chatName: string) {
    return this.request<Chat>("/chat/rename", {
      method: "PUT",
      body: JSON.stringify({ chatId, chatName }),
    })
  }

  async addToGroup(chatId: string, userId: string) {
    return this.request<Chat>("/chat/group-add", {
      method: "PUT",
      body: JSON.stringify({ chatId, userId }),
    })
  }

  async removeFromGroup(chatId: string, userId: string) {
    return this.request<Chat>("/chat/group-remove", {
      method: "PUT",
      body: JSON.stringify({ chatId, userId }),
    })
  }

  async sendMessage(chatId: string, content: string) {
    return this.request<Message>("/message", {
      method: "POST",
      body: JSON.stringify({ chatId, content }),
    })
  }

  async getMessages(chatId: string) {
    return this.request<Message[]>(`/message/${chatId}`)
  }
}

export const chatService = new ChatService()

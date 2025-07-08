export interface User {
  _id: string
  fullName: string
  email: string
  avatar?: string
  status: "online" | "offline" | "away"
  lastSeen?: string
  createdAt: string
  updatedAt: string
}

export interface Chat {
  _id: string
  chatName: string
  isGroupChat: boolean
  users: User[]
  latestMessage?: Message
  groupAdmin?: User
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  sender: User
  content: string
  contentType: "text" | "image" | "file"
  chat: Chat
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  statusCode: number
  data: T
  message: string
  success: boolean
}

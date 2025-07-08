"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useSocket } from "@/contexts/SocketContext"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { WelcomeScreen } from "@/components/chat/WelcomeScreen"
import { chatService } from "@/services/chatService"
import type { Chat, Message } from "@/types"

export default function ChatPage() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchChats()
    }
  }, [user])

  useEffect(() => {
    if (socket) {
      socket.on("message received", (newMessage: Message) => {
        if (selectedChat && newMessage.chat._id === selectedChat._id) {
          setMessages((prev) => [...prev, newMessage])
        }
        // Update chat list with latest message
        setChats((prev) =>
          prev.map((chat) => (chat._id === newMessage.chat._id ? { ...chat, latestMessage: newMessage } : chat)),
        )
      })

      return () => {
        socket.off("message received")
      }
    }
  }, [socket, selectedChat])

  const fetchChats = async () => {
    try {
      const response = await chatService.fetchChats()
      setChats(response.data)
    } catch (error) {
      console.error("Failed to fetch chats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat)
    if (socket) {
      socket.emit("join chat", chat._id)
    }

    try {
      const response = await chatService.getMessages(chat._id)
      setMessages(response.data)
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedChat || !socket) return

    try {
      const response = await chatService.sendMessage(selectedChat._id, content)
      const newMessage = response.data

      setMessages((prev) => [...prev, newMessage])
      socket.emit("new message", newMessage)

      // Update chat list
      setChats((prev) =>
        prev.map((chat) => (chat._id === selectedChat._id ? { ...chat, latestMessage: newMessage } : chat)),
      )
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleNewChat = (newChat: Chat) => {
    setChats((prev) => [newChat, ...prev])
    setSelectedChat(newChat)
    setMessages([])
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <ChatSidebar
        chats={chats}
        selectedChat={selectedChat}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow chat={selectedChat} messages={messages} onSendMessage={handleSendMessage} />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  )
}

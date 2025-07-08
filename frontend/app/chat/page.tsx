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
  const { socket, isConnected } = useSocket()

  // State management
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch chats when user is available
  useEffect(() => {
    if (user) {
      console.log("👤 User available, fetching chats for:", user.fullName)
      fetchChats()
    }
  }, [user])

  // Socket connection and message listener
  useEffect(() => {
    if (socket && isConnected && user) {
      console.log("🎧 Setting up socket listeners for user:", user.fullName)

      const handleMessageReceived = (newMessage: Message) => {
        console.log("📨 Frontend received message:", {
          messageId: newMessage._id,
          chatId: newMessage.chat._id,
          sender: newMessage.sender.fullName,
          content: newMessage.content,
          chatUsers: newMessage.chat.users?.map((u) => ({ name: u.fullName, id: u._id })),
          currentUser: user.fullName,
          selectedChatId: selectedChat?._id,
        })

        // Update messages if this is for the current chat
        if (selectedChat && newMessage.chat._id === selectedChat._id) {
          console.log("✅ Adding message to current chat")
          setMessages((prevMessages) => {
            // Check for duplicates
            const exists = prevMessages.some((msg) => msg._id === newMessage._id)
            if (exists) {
              console.log("⚠️ Message already exists")
              return prevMessages
            }
            return [...prevMessages, newMessage]
          })
        }

        // Always update chat list with latest message
        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat._id === newMessage.chat._id) {
              console.log("📝 Updating chat list for:", chat.chatName || "Direct Chat")
              return { ...chat, latestMessage: newMessage }
            }
            return chat
          })
        })
      }

      // Add event listener
      socket.on("message received", handleMessageReceived)

      // Cleanup function
      return () => {
        console.log("🔇 Cleaning up socket listeners")
        socket.off("message received", handleMessageReceived)
      }
    }
  }, [socket, isConnected, user, selectedChat])

  // Fetch chats from API
  const fetchChats = async () => {
    try {
      setLoading(true)
      console.log("📋 Fetching chats...")
      const response = await chatService.fetchChats()

      console.log("✅ Chats fetched:", response.data.length)
      console.log(
        "📋 Chat details:",
        response.data.map((chat) => ({
          id: chat._id,
          name: chat.chatName,
          users: chat.users.map((u) => ({ name: u.fullName, id: u._id })),
        })),
      )

      setChats(response.data)
    } catch (error) {
      console.error("❌ Failed to fetch chats:", error)
      setChats([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Handle chat selection
  const handleChatSelect = async (chat: Chat) => {
    console.log("💬 Selecting chat:", {
      chatId: chat._id,
      chatName: chat.chatName,
      users: chat.users.map((u) => ({ name: u.fullName, id: u._id })),
    })

    // Update selected chat
    setSelectedChat(chat)

    // Clear previous messages
    setMessages([])

    // Join socket room
    if (socket && isConnected) {
      socket.emit("join chat", chat._id)
      console.log("🏠 Joined chat room:", chat._id)
    }

    // Fetch messages for this chat
    try {
      console.log("📨 Fetching messages for chat:", chat._id)
      const response = await chatService.getMessages(chat._id)

      console.log("✅ Messages loaded:", response.data.length)
      setMessages(response.data)
    } catch (error) {
      console.error("❌ Failed to fetch messages:", error)
      setMessages([]) // Set empty array on error
    }
  }

  // Handle sending new message
  const handleSendMessage = async (content: string) => {
    if (!selectedChat || !socket || !isConnected || !user) {
      console.error("❌ Cannot send message - missing requirements")
      return
    }

    try {
      console.log("📤 Sending message:", {
        chatId: selectedChat._id,
        content: content.substring(0, 50) + "...",
        sender: user.fullName,
        chatUsers: selectedChat.users.map((u) => ({ name: u.fullName, id: u._id })),
      })

      // Send message to backend
      const response = await chatService.sendMessage(selectedChat._id, content)
      const newMessage = response.data

      console.log("✅ Message saved to database:", {
        messageId: newMessage._id,
        chatUsers: newMessage.chat.users?.map((u) => ({ name: u.fullName, id: u._id })),
      })

      // Add message to current view immediately (optimistic update)
      setMessages((prevMessages) => [...prevMessages, newMessage])

      // Emit to socket for real-time delivery
      console.log("📡 Broadcasting message via socket")
      socket.emit("new message", newMessage)

      // Update chat list with latest message
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat._id === selectedChat._id) {
            return { ...chat, latestMessage: newMessage }
          }
          return chat
        })
      })
    } catch (error) {
      console.error("❌ Failed to send message:", error)
    }
  }

  // Handle new chat creation
  const handleNewChat = (newChat: Chat) => {
    console.log("➕ Adding new chat:", newChat._id)

    // Add to chat list
    setChats((prevChats) => [newChat, ...prevChats])

    // Select the new chat
    setSelectedChat(newChat)

    // Clear messages
    setMessages([])
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading chats...</span>
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
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {/* Connection Status Indicator */}
      <div
        className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm z-50 ${
          isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
      </div>

      {/* Debug Info */}
      <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50 max-w-xs">
        <div>User: {user?.fullName}</div>
        <div>Chats: {chats.length}</div>
        <div>Selected: {selectedChat?.chatName || "None"}</div>
        <div>Messages: {messages.length}</div>
        <div>Socket: {isConnected ? "✅" : "❌"}</div>
        {selectedChat && <div>Users: {selectedChat.users.map((u) => u.fullName).join(", ")}</div>}
      </div>
    </div>
  )
}

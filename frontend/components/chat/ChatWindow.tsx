"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { Chat, Message } from "@/types"
import { Send, Users, MoreVertical, Wifi, WifiOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatWindowProps {
  chat: Chat
  messages: Message[]
  onSendMessage: (content: string) => void
  isConnected: boolean
}

export function ChatWindow({ chat, messages, onSendMessage, isConnected }: ChatWindowProps) {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && isConnected) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  const getChatName = () => {
    if (chat.isGroupChat) {
      return chat.chatName
    }
    const otherUser = chat.users.find((u) => u._id !== user?._id)
    return otherUser?.fullName || "Unknown User"
  }

  const getChatAvatar = () => {
    if (chat.isGroupChat) {
      return null
    }
    const otherUser = chat.users.find((u) => u._id !== user?._id)
    return otherUser?.avatar
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getChatAvatar() || undefined} />
              <AvatarFallback>
                {chat.isGroupChat ? <Users className="h-5 w-5" /> : getChatName().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="font-semibold">{getChatName()}</h2>
              <div className="flex items-center space-x-2">
                {chat.isGroupChat && (
                  <Badge variant="secondary" className="text-xs">
                    {chat.users.length} members
                  </Badge>
                )}
                <div className="flex items-center space-x-1">
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${isConnected ? "text-green-600" : "text-red-600"}`}>
                    {isConnected ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user?._id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender._id === user?._id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {chat.isGroupChat && message.sender._id !== user?._id && (
                    <p className="text-xs font-medium mb-1 opacity-75">{message.sender.fullName}</p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.sender._id === user?._id ? "text-blue-100" : "text-gray-500"}`}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            className="flex-1"
            disabled={!isConnected}
          />
          <Button type="submit" disabled={!newMessage.trim() || !isConnected}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {!isConnected && (
          <p className="text-xs text-red-500 mt-1">Connection lost. Messages will be sent when reconnected.</p>
        )}
      </div>
    </div>
  )
}

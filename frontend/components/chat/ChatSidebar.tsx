"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserSearch } from "./UserSearch"
import { CreateGroupDialog } from "./CreateGroupDialog"
import { ProfileDialog } from "./ProfileDialog"
import type { Chat } from "@/types"
import { MessageCircle, Users, Settings, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatSidebarProps {
  chats: Chat[]
  selectedChat: Chat | null
  onChatSelect: (chat: Chat) => void
  onNewChat: (chat: Chat) => void
}

export function ChatSidebar({ chats, selectedChat, onChatSelect, onNewChat }: ChatSidebarProps) {
  const { user, logout } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChats = chats.filter(
    (chat) =>
      chat.chatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.users.some((u) => u.fullName.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const getChatName = (chat: Chat) => {
    if (chat.isGroupChat) {
      return chat.chatName
    }
    const otherUser = chat.users.find((u) => u._id !== user?._id)
    return otherUser?.fullName || "Unknown User"
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroupChat) {
      return null
    }
    const otherUser = chat.users.find((u) => u._id !== user?._id)
    return otherUser?.avatar
  }

  const getLastMessageTime = (chat: Chat) => {
    if (!chat.latestMessage) return ""
    return formatDistanceToNow(new Date(chat.latestMessage.createdAt), { addSuffix: true })
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Chats</h1>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setGroupDialogOpen(true)}>
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setProfileOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No chats found</p>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={() => setSearchOpen(true)}>
                Start a conversation
              </Button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?._id === chat._id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                }`}
                onClick={() => onChatSelect(chat)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getChatAvatar(chat) || undefined} />
                    <AvatarFallback>
                      {chat.isGroupChat ? <Users className="h-5 w-5" /> : getChatName(chat).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{getChatName(chat)}</p>
                      {chat.isGroupChat && (
                        <Badge variant="secondary" className="text-xs">
                          {chat.users.length}
                        </Badge>
                      )}
                    </div>

                    {chat.latestMessage && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 truncate">
                          {chat.latestMessage.sender.fullName}: {chat.latestMessage.content}
                        </p>
                        <span className="text-xs text-gray-400">{getLastMessageTime(chat)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* User Search Dialog */}
      <UserSearch open={searchOpen} onOpenChange={setSearchOpen} onChatCreated={onNewChat} />

      {/* Create Group Dialog */}
      <CreateGroupDialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen} onGroupCreated={onNewChat} />

      {/* Profile Dialog */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { chatService } from "@/services/chatService"
import { authService } from "@/services/authService"
import type { User, Chat } from "@/types"
import { Search, Loader2 } from "lucide-react"

interface UserSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChatCreated: (chat: Chat) => void
}

export function UserSearch({ open, onOpenChange, onChatCreated }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await authService.searchUsers(searchQuery)
      setSearchResults(response.data)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChat = async (userId: string) => {
    setCreating(userId)
    try {
      const response = await chatService.accessChat(userId)
      onChatCreated(response.data)
      onOpenChange(false)
      setSearchQuery("")
      setSearchResults([])
    } catch (error) {
      console.error("Failed to create chat:", error)
    } finally {
      setCreating(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <ScrollArea className="h-64">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "No users found" : "Search for users to start chatting"}
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <Button size="sm" onClick={() => handleCreateChat(user._id)} disabled={creating === user._id}>
                      {creating === user._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Chat"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

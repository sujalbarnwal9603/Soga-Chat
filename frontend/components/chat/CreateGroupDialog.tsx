"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { chatService } from "@/services/chatService"
import { authService } from "@/services/authService"
import type { User, Chat } from "@/types"
import { Search, Loader2, Users } from "lucide-react"

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated: (chat: Chat) => void
}

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

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

  const handleUserToggle = (user: User, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, user])
    } else {
      setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id))
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) return

    setCreating(true)
    try {
      const userIds = selectedUsers.map((u) => u._id)
      const response = await chatService.createGroupChat(groupName, userIds)
      onGroupCreated(response.data)
      onOpenChange(false)

      // Reset form
      setGroupName("")
      setSearchQuery("")
      setSearchResults([])
      setSelectedUsers([])
    } catch (error) {
      console.error("Failed to create group:", error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Create Group Chat</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Members ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                  >
                    <span>{user.fullName}</span>
                    <button onClick={() => handleUserToggle(user, false)} className="text-blue-600 hover:text-blue-800">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ScrollArea className="h-48">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "No users found" : "Search for users to add to group"}
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <Checkbox
                      checked={selectedUsers.some((u) => u._id === user._id)}
                      onCheckedChange={(checked) => handleUserToggle(user, checked as boolean)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedUsers.length < 2 || creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/services/authService"
import { LogOut, Upload, Loader2 } from "lucide-react"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, logout } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [avatar, setAvatar] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpdateName = async () => {
    if (!fullName.trim()) return

    setLoading(true)
    try {
      await authService.updateName(fullName)
      // Refresh user data
      window.location.reload()
    } catch (error) {
      console.error("Failed to update name:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return

    setLoading(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      alert("Password changed successfully")
    } catch (error) {
      console.error("Failed to change password:", error)
      alert("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAvatar = async () => {
    if (!avatar) return

    setLoading(true)
    try {
      await authService.updateAvatar(avatar)
      setAvatar(null)
      // Refresh user data
      window.location.reload()
    } catch (error) {
      console.error("Failed to update avatar:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">{user?.fullName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                className="hidden"
                id="avatar-upload"
              />
              <Button variant="outline" size="sm" onClick={() => document.getElementById("avatar-upload")?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Choose Photo
              </Button>
              {avatar && (
                <Button size="sm" onClick={handleUpdateAvatar} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                </Button>
              )}
            </div>
          </div>

          {/* Name Section */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="flex space-x-2">
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Button onClick={handleUpdateName} disabled={loading || !fullName.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email} disabled />
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Change Password</h3>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>

          {/* Logout */}
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

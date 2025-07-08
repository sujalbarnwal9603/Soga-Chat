import { MessageCircle, Users, Search } from "lucide-react"

export function WelcomeScreen() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Chat App</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          Select a chat from the sidebar to start messaging, or create a new conversation.
        </p>

        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Search users</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Create groups</span>
          </div>
        </div>
      </div>
    </div>
  )
}

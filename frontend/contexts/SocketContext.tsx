"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./AuthContext"

interface SocketContextType {
  socket: Socket | null
  onlineUsers: string[]
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      console.log("🔌 Connecting to socket server for user:", user._id)

      const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000", {
        withCredentials: true,
        transports: ["websocket", "polling"],
        upgrade: true,
        rememberUpgrade: true,
        forceNew: true, // Force new connection
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      // Connection events
      newSocket.on("connect", () => {
        console.log("✅ Socket connected with ID:", newSocket.id)
        setIsConnected(true)

        // Setup user after connection
        console.log("📤 Emitting setup for user:", user._id)
        newSocket.emit("setup", user)
      })

      newSocket.on("connected", () => {
        console.log("🎉 Setup confirmed by server")
      })

      newSocket.on("disconnect", (reason) => {
        console.log("🔴 Socket disconnected:", reason)
        setIsConnected(false)
      })

      newSocket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error)
        setIsConnected(false)
      })

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("🔄 Socket reconnected after", attemptNumber, "attempts")
        setIsConnected(true)
        // Re-setup user after reconnection
        newSocket.emit("setup", user)
      })

      setSocket(newSocket)

      return () => {
        console.log("🔌 Cleaning up socket connection")
        newSocket.close()
        setSocket(null)
        setIsConnected(false)
      }
    } else if (socket) {
      console.log("👤 User logged out, closing socket")
      socket.close()
      setSocket(null)
      setIsConnected(false)
    }
  }, [user])

  return <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

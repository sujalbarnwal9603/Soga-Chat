import type { ApiResponse, User } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class AuthService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem("accessToken")

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: "include",
      ...options,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Request failed")
    }

    return response.json()
  }

  async login(email: string, password: string) {
    return this.request<{ user: User; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(fullName: string, email: string, password: string, avatar?: File | null) {
    const formData = new FormData()
    formData.append("fullName", fullName)
    formData.append("email", email)
    formData.append("password", password)
    if (avatar) {
      formData.append("avatar", avatar)
    }

    const token = localStorage.getItem("accessToken")
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: "include",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Registration failed")
    }

    return response.json()
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" })
  }

  async getCurrentUser() {
    return this.request<User>("/auth/me")
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  async updateName(fullName: string) {
    return this.request<User>("/auth/change-name", {
      method: "PUT",
      body: JSON.stringify({ fullName }),
    })
  }

  async updateAvatar(avatar: File) {
    const formData = new FormData()
    formData.append("avatar", avatar)

    const token = localStorage.getItem("accessToken")
    const response = await fetch(`${API_BASE_URL}/auth/update-avatar`, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: "include",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Avatar update failed")
    }

    return response.json()
  }

  async searchUsers(query: string) {
    return this.request<User[]>(`/auth/search?search=${encodeURIComponent(query)}`)
  }
}

export const authService = new AuthService()

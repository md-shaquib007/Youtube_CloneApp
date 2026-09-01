import { useCallback, useEffect, useState } from 'react'
import { api, clearTokens, getAccessToken, setTokens } from '../api/client'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const currentUser = await api.getCurrentUser()
      setUser(currentUser)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (credentials) => {
    const data = await api.login(credentials)
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const newUser = await api.register(formData)
    return newUser
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // Clear local session even if server logout fails
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, refreshUser: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

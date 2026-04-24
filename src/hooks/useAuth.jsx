import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentSession, subscribeAuth } from '../lib/localStore'

const AuthCtx = createContext()

export function AuthProvider({ children }) {
  const [user] = useState(null)
  const [profile] = useState(null)
  const [loading] = useState(false)

  return (
    <AuthCtx.Provider value={{ user, profile, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
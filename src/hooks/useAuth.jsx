import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentSession, subscribeAuth } from '../lib/localStore'

const AuthCtx = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getCurrentSession())

  useEffect(() => {
    const unsub = subscribeAuth(() => setSession(getCurrentSession()))
    return unsub
  }, [])

  return (
    <AuthCtx.Provider value={{
      user: session?.user || null,
      profile: session?.profile || null,
      loading: false,
      refreshProfile: () => setSession(getCurrentSession()),
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
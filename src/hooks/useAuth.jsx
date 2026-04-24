import { createContext, useContext, useState } from "react"

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
const STORAGE_KEY = 'mirror-app-store'
const SESSION_KEY = 'mirror-app-session'
const subscribers = new Set()

function safeJSON(raw) {
  try { return JSON.parse(raw) } catch { return null }
}

function loadStore() {
  if (typeof window === 'undefined') return { users: [], logs: [], decisions: [] }
  const raw = localStorage.getItem(STORAGE_KEY)
  const store = safeJSON(raw)
  if (!store || typeof store !== 'object') return { users: [], logs: [], decisions: [] }
  return {
    users: Array.isArray(store.users) ? store.users : [],
    logs: Array.isArray(store.logs) ? store.logs : [],
    decisions: Array.isArray(store.decisions) ? store.decisions : [],
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  return store
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2,10)}`
}

function omitPassword(user) {
  if (!user) return null
  const { password, ...rest } = user
  return rest
}

function getUserByEmail(email) {
  const store = loadStore()
  const normalized = normalizeEmail(email)
  return store.users.find(u => u.email === normalized)
}

function getUserById(id) {
  const store = loadStore()
  return store.users.find(u => u.id === id)
}

function updateUser(userId, updates) {
  const store = loadStore()
  const user = store.users.find(u => u.id === userId)
  if (!user) return null
  Object.assign(user, updates)
  saveStore(store)
  return user
}

function setSession(userId) {
  if (typeof window === 'undefined') return
  if (!userId) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, userId)
  subscribers.forEach(cb => cb())
}

export function subscribeAuth(cb) {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

export function getCurrentSession() {
  if (typeof window === 'undefined') return null
  const sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) return null
  const user = getUserById(sessionId)
  if (!user) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  return {
    user: { id: user.id, email: user.email },
    profile: omitPassword(user),
  }
}

function buildProfile(email) {
  return {
    id: generateId(),
    email: normalizeEmail(email),
    password: '',
    role: 'member',
    full_name: email.split('@')[0],
    onboarded: false,
    persona: null,
  }
}

export async function signInWithEmail(email, password) {
  if (!email || !password) return { error: new Error('Email and password are required.') }
  const user = getUserByEmail(email)
  if (!user) return { error: new Error('No account found for that email.') }
  if (user.password !== password) return { error: new Error('Invalid password.') }
  setSession(user.id)
  return { error: null }
}

export async function signUpWithEmail(email, password) {
  if (!email || !password) return { error: new Error('Email and password are required.') }
  const existing = getUserByEmail(email)
  if (existing) return { error: new Error('An account already exists for that email.') }
  const store = loadStore()
  const user = buildProfile(email)
  user.password = password
  store.users.push(user)
  saveStore(store)
  setSession(user.id)
  return { error: null }
}

export async function signInWithGoogle() {
  const email = 'google.user@example.com'
  const store = loadStore()
  let user = store.users.find(u => u.email === email)
  if (!user) {
    user = buildProfile(email)
    user.full_name = 'Google User'
    user.onboarded = false
    store.users.push(user)
    saveStore(store)
  }
  setSession(user.id)
  return { error: null }
}

export async function signOut() {
  setSession(null)
  return { error: null }
}

export async function savePersona(userId, persona) {
  const user = updateUser(userId, { persona, onboarded: true })
  if (!user) return { error: new Error('Unable to save persona.') }
  subscribers.forEach(cb => cb())
  return { data: user }
}

function normalizeDayLog(record, userId) {
  const entry = {
    id: generateId(),
    user_id: userId,
    mood: record.mood || '',
    decision: record.decision || '',
    time_spent: record.timeSpent || record.time_spent || '',
    goal_progress: record.goalProgress || record.goal_progress || '',
    alignment_score: record.alignmentScore || record.alignment_score || 0,
    twin_commentary: record.twinCommentary || record.twin_commentary || '',
    created_at: new Date().toISOString(),
  }
  return entry
}

export async function saveDayLog(userId, record) {
  const store = loadStore()
  const entry = normalizeDayLog(record, userId)
  store.logs.unshift(entry)
  saveStore(store)
  return { data: entry }
}

export async function getDayLogs(userId) {
  const store = loadStore()
  const data = store.logs.filter(log => log.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return { data }
}

export async function saveDecision(userId, decision) {
  const store = loadStore()
  store.decisions.unshift({
    id: generateId(),
    user_id: userId,
    ...decision,
    created_at: new Date().toISOString(),
  })
  saveStore(store)
  return { data: store.decisions[0] }
}

export async function getAllDayLogs() {
  const store = loadStore()
  return { data: store.logs.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }
}

export async function getAllProfiles() {
  const store = loadStore()
  return { data: store.users.map(u => omitPassword(u)) }
}

export async function adminDeleteLog(id) {
  const store = loadStore()
  store.logs = store.logs.filter(log => log.id !== id)
  saveStore(store)
  return { error: null }
}

export async function getUserProfile(userId) {
  const user = getUserById(userId)
  return { data: omitPassword(user) }
}

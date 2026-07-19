/**
 * Client-side session token storage.
 * Stores the admin session token in sessionStorage (survives page reloads, clears on tab close).
 * Used as Authorization: Bearer <token> header in admin API requests — this works in iframe
 * previews where sameSite cookies may be blocked by the browser.
 */

const TOKEN_KEY = 'co_admin_token'
const USERNAME_KEY = 'co_admin_username'

export function saveSession(token: string, username: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USERNAME_KEY, username)
  } catch {
    // sessionStorage might be blocked in some iframes — fallback to memory
    memoryToken = token
    memoryUsername = username
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USERNAME_KEY)
  } catch {
    // ignore
  }
  memoryToken = null
  memoryUsername = null
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(TOKEN_KEY) || memoryToken
  } catch {
    return memoryToken
  }
}

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(USERNAME_KEY) || memoryUsername
  } catch {
    return memoryUsername
  }
}

// Memory fallback when sessionStorage is blocked
let memoryToken: string | null = null
let memoryUsername: string | null = null

/**
 * Returns fetch options with the Authorization header attached (if a token exists).
 * Use: `await fetch(url, authFetchOptions({ method: 'POST', body: ... }))`
 */
export function authFetchOptions(options: RequestInit = {}): RequestInit {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return { ...options, headers }
}

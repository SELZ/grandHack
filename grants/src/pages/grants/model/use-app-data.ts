import { useEffect, useRef, useState } from 'react'
import { fetchGrants, type Grant } from '@/entities/grant'
import { apiRequest } from '@/shared/api/client'
import { maxInitData } from '@/shared/lib/max-bridge'
import { emptyBusinessProfile, type BusinessProfile } from '@/entities/business-profile'

function getWebUserId() {
  const storageKey = 'grantshak-web-user-id'
  const stored = localStorage.getItem(storageKey)
  if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)) return stored
  const id = crypto.randomUUID()
  localStorage.setItem(storageKey, id)
  return id
}

export function useAppData() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [profile, setProfile] = useState<BusinessProfile>({ ...emptyBusinessProfile })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const token = useRef<string | null>(null)
  const pendingFavorites = useRef(new Set<string>())

  useEffect(() => {
    const controller = new AbortController()
    token.current = null
    async function load() {
      const initData = await maxInitData()
      const auth = await apiRequest<{ token: string }>(initData ? '/auth/max' : '/auth/web', {
        method: 'POST', body: JSON.stringify(initData ? { initData } : { id: getWebUserId() }), signal: controller.signal,
      })
      const [catalog, favorites, business] = await Promise.all([
        fetchGrants(controller.signal),
        apiRequest<{ grantIds: string[] }>('/favorites', { signal: controller.signal }, auth.token),
        apiRequest<{ profile: BusinessProfile }>('/profile', { signal: controller.signal }, auth.token),
      ])
      if (controller.signal.aborted) return
      token.current = auth.token
      setGrants(catalog)
      setFavoriteIds(favorites.grantIds)
      setProfile(business.profile)
      setLoading(false)
    }
    void load().catch(cause => {
      if (controller.signal.aborted) return
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить данные')
      setLoading(false)
    })
    return () => controller.abort()
  }, [attempt])

  async function toggleFavorite(id: string) {
    if (!token.current || pendingFavorites.current.has(id) || !grants.some(grant => grant.id === id)) return
    pendingFavorites.current.add(id)
    setMutationError('')
    const saved = favoriteIds.includes(id)
    try {
      await apiRequest(`/favorites/${encodeURIComponent(id)}`, { method: saved ? 'DELETE' : 'POST' }, token.current)
      setFavoriteIds(current => saved ? current.filter(value => value !== id) : [...new Set([...current, id])])
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : 'Не удалось изменить избранное')
    } finally { pendingFavorites.current.delete(id) }
  }

  async function saveProfile(value: BusinessProfile) {
    if (!token.current) throw new Error('Сессия недоступна. Откройте приложение заново.')
    const { profile: saved } = await apiRequest<{ profile: BusinessProfile }>('/profile', { method: 'PUT', body: JSON.stringify(value) }, token.current)
    setProfile(saved)
  }

  async function askAssistant(message: string) {
    if (!token.current) throw new Error('Сессия недоступна. Откройте приложение заново.')
    return apiRequest<{ text: string; grantIds: string[] }>('/assistant', {
      method: 'POST', body: JSON.stringify({ message }),
    }, token.current)
  }

  return { grants, favoriteIds, profile, loading, error, mutationError, toggleFavorite, saveProfile, askAssistant,
    retry: () => { setLoading(true); setError(''); setAttempt(value => value + 1) }, clearMutationError: () => setMutationError('') }
}

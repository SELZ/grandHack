import { useEffect, useRef, useState } from 'react'
import { fetchGrants, type Grant } from '@/entities/grant'
import { apiRequest } from '@/shared/api/client'
import { maxInitData } from '@/shared/lib/max-bridge'
import { emptyBusinessProfile, type BusinessProfile } from '@/entities/business-profile'

export function useAppData() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [profile, setProfile] = useState<BusinessProfile>({ ...emptyBusinessProfile })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [localMode, setLocalMode] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const token = useRef<string | null>(null)
  const pendingFavorites = useRef(new Set<string>())

  useEffect(() => {
    const controller = new AbortController()
    token.current = null
    async function load() {
      const initData = await maxInitData()
      const config = await apiRequest<{ devAuthEnabled: boolean }>('/config', { signal: controller.signal })
      if (!initData && !config.devAuthEnabled) throw new Error('Откройте приложение через бота в MAX. Локальный вход на этом сервере выключен.')
      const auth = await apiRequest<{ token: string }>(initData ? '/auth/max' : '/auth/dev', {
        method: 'POST', body: JSON.stringify(initData ? { initData } : {}), signal: controller.signal,
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
      setLocalMode(!initData)
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

  return { grants, favoriteIds, profile, loading, error, mutationError, localMode, toggleFavorite, saveProfile,
    retry: () => { setLoading(true); setError(''); setAttempt(value => value + 1) }, clearMutationError: () => setMutationError('') }
}

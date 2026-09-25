import { useCallback, useEffect, useMemo, useState } from 'react'

const favoritesKey = 'grants:favorites'

function normalizeFavorites(value: unknown, validIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return []

  return [...new Set(value.filter((id): id is string => typeof id === 'string' && validIds.has(id)))]
}

function readFavorites(validIds: ReadonlySet<string>): string[] {
  try {
    return normalizeFavorites(JSON.parse(localStorage.getItem(favoritesKey) ?? '[]'), validIds)
  } catch {
    return []
  }
}

export function useFavorites(validIds: readonly string[]) {
  const validIdSet = useMemo(() => new Set(validIds), [validIds])
  const [storedIds, setStoredIds] = useState(() => readFavorites(validIdSet))
  const favoriteIds = useMemo(() => normalizeFavorites(storedIds, validIdSet), [storedIds, validIdSet])

  useEffect(() => {
    try {
      localStorage.setItem(favoritesKey, JSON.stringify(favoriteIds))
    } catch {
      // Keep favorites available for this session if browser storage is unavailable.
    }
  }, [favoriteIds])

  const toggleFavorite = useCallback((id: string) => {
    if (!validIdSet.has(id)) return

    setStoredIds((current) => {
      const validFavorites = normalizeFavorites(current, validIdSet)
      return validFavorites.includes(id)
        ? validFavorites.filter((favoriteId) => favoriteId !== id)
        : [...validFavorites, id]
    })
  }, [validIdSet])

  return { favoriteIds, toggleFavorite }
}

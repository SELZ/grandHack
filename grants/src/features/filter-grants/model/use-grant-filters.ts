import { useState } from 'react'
import { defaultGrantFilters, type GrantFiltersValue } from './filter-grants'

export function useGrantFilters() {
  const [filters, setFilters] = useState<GrantFiltersValue>({ ...defaultGrantFilters })

  function setQuery(query: string) {
    setFilters((current) => ({ ...current, query }))
  }

  function setCategoryId(categoryId: string) {
    setFilters((current) => ({ ...current, categoryId }))
  }

  function setStage(stage: string) {
    setFilters((current) => ({ ...current, stage: stage === 'all' ? '' : stage }))
  }

  function applyProfile(categoryId: string, stage: string) {
    setFilters({ query: '', categoryId, stage: stage === 'all' ? '' : stage })
  }

  function resetFilters() {
    setFilters({ ...defaultGrantFilters })
  }

  return {
    filters,
    setQuery,
    setCategoryId,
    setStage,
    applyProfile,
    resetFilters,
    hasFilters: Boolean(filters.query.trim() || filters.categoryId !== 'all' || filters.stage),
  }
}

import {
  categories,
  getRegionLabel,
  industryLabels,
  stageLabels,
} from '@/entities/grant/model/catalogs'
import type { Grant } from '@/entities/grant/model/types'

export type GrantFiltersValue = {
  query: string
  categoryId: string
  stage: string
}

export const defaultGrantFilters: GrantFiltersValue = {
  query: '',
  categoryId: 'all',
  stage: '',
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim()
}

function getSearchText(grant: Grant): string {
  return normalizeSearch(
    [
      grant.title,
      grant.org,
      grant.summary,
      grant.sphere,
      grant.amountText || (grant.amount === null ? '' : String(grant.amount)),
      grant.deadlineText,
      grant.deadlineISO ?? '',
      ...grant.requirements,
      ...grant.notes,
      ...grant.industries,
      ...grant.industries.map((industry) => industryLabels[industry] ?? industry),
      ...categories
        .filter((category) => category.industries.some((industry) => grant.industries.includes(industry)))
        .map((category) => category.label),
      ...grant.regions.map(getRegionLabel),
      ...grant.stages.map((stage) => stageLabels[stage] ?? stage),
    ].join(' '),
  )
}

export function filterGrants(items: readonly Grant[], filters: GrantFiltersValue): Grant[] {
  const category = categories.find((item) => item.id === filters.categoryId)
  const searchTerms = normalizeSearch(filters.query).match(/[\p{L}\p{N}₽]+/gu) ?? []

  return items.filter((grant) => {
    const matchesCategory =
      !category ||
      category.id === 'all' ||
      grant.industries.includes('any') ||
      grant.industries.some((industry) => category.industries.includes(industry))
    const matchesStage =
      !filters.stage || filters.stage === 'all' || grant.stages.includes(filters.stage)

    if (!matchesCategory || !matchesStage) return false
    if (searchTerms.length === 0) return true

    const searchText = getSearchText(grant)

    return searchTerms.every((term) => {
      // IT/ИТ is an abbreviation: do not match it inside unrelated words.
      if (term === 'it' || term === 'ит') {
        return /(?:^|[^\p{L}\p{N}])(?:it|ит)(?=$|[^\p{L}\p{N}])/u.test(searchText)
      }
      return searchText.includes(term)
    })
  })
}

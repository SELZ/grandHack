import grantData from './grants.json'

export type Grant = {
  id: string
  title: string
  org: string
  amount: number | null
  amountText: string
  deadlineISO: string | null
  deadlineText: string
  industries: string[]
  regions: string[]
  stages: string[]
  summary: string
  requirements: string[]
  notes: string[]
  sphere: string
  url: string
  isNew: boolean
}

export const grants: Grant[] = grantData

export const categories: { id: string; label: string; industries: string[] }[] = [
  { id: 'all', label: 'Все', industries: [] },
  { id: 'it', label: 'IT', industries: ['it', 'innovation'] },
  { id: 'trade', label: 'Торговля', industries: ['trade', 'export'] },
  { id: 'production', label: 'Производство', industries: ['production', 'innovation'] },
  { id: 'agriculture', label: 'Сельское', industries: ['agriculture'] },
  { id: 'food', label: 'Общепит', industries: ['food'] },
  { id: 'services', label: 'Услуги', industries: ['services', 'tourism'] },
  { id: 'education', label: 'Образование', industries: ['education'] },
  { id: 'medicine', label: 'Медицина', industries: ['medicine'] },
  { id: 'construction', label: 'Строительство', industries: ['construction'] },
  { id: 'creative', label: 'Креативные', industries: ['creative', 'culture'] },
]

export const industryLabels: Record<string, string> = {
  any: 'Любая отрасль',
  it: 'IT и цифровые технологии',
  innovation: 'Инновации и технологии',
  trade: 'Торговля',
  export: 'Экспорт',
  production: 'Производство',
  agriculture: 'Сельское хозяйство',
  food: 'Общепит и пищепром',
  services: 'Услуги',
  tourism: 'Туризм',
  education: 'Образование',
  medicine: 'Медицина',
  construction: 'Строительство',
  creative: 'Креативные индустрии',
  culture: 'Культура и искусство',
}

export const stageLabels: Record<string, string> = {
  idea: 'Идея',
  start: 'Запуск бизнеса',
  growth: 'Развитие бизнеса',
  scale: 'Масштабирование',
}

export function getRegionLabel(code: string): string {
  return code === 'all' ? 'Все регионы' : code
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim()
}

export function filterGrants(
  items: readonly Grant[],
  { query, categoryId, stage }: { query: string; categoryId: string; stage?: string },
): Grant[] {
  const category = categories.find((item) => item.id === categoryId)
  const searchTerms = normalizeSearch(query).split(/\s+/).filter(Boolean)

  return items.filter((grant) => {
    const matchesCategory =
      !category ||
      category.id === 'all' ||
      grant.industries.includes('any') ||
      grant.industries.some((industry) => category.industries.includes(industry))

    if (!matchesCategory || (stage && stage !== 'all' && !grant.stages.includes(stage))) {
      return false
    }

    if (searchTerms.length === 0) return true

    const searchText = normalizeSearch(
      [
        grant.title,
        grant.org,
        grant.summary,
        grant.sphere,
        grant.amountText || (grant.amount === null ? '' : String(grant.amount)),
        grant.deadlineText,
        grant.deadlineISO ?? '',
        grant.url,
        ...grant.requirements,
        ...grant.notes,
        ...grant.industries,
        ...grant.industries.map((industry) => industryLabels[industry] ?? industry),
        ...categories
          .filter((item) => item.industries.some((industry) => grant.industries.includes(industry)))
          .map((item) => item.label),
        ...grant.regions.map(getRegionLabel),
        ...grant.stages.map((item) => stageLabels[item] ?? item),
      ].join(' '),
    )

    return searchTerms.every((term) => searchText.includes(term))
  })
}

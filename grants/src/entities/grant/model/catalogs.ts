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

import { categories, stageLabels } from '@/entities/grant'

export type BusinessProfile = {
  name: string
  categoryId: string
  stage: string
  employees: string
  annualRevenue: string
  legalForm: string
}

export const businessProfileStorageKey = 'grants:business-profile'

export const emptyBusinessProfile: BusinessProfile = {
  name: '',
  categoryId: '',
  stage: '',
  employees: '',
  annualRevenue: '',
  legalForm: '',
}

export const legalForms = [
  { value: 'not-registered', label: 'Бизнес ещё не зарегистрирован' },
  { value: 'self-employed', label: 'Самозанятый' },
  { value: 'individual', label: 'Индивидуальный предприниматель' },
  { value: 'company', label: 'Общество с ограниченной ответственностью' },
  { value: 'nonprofit', label: 'Некоммерческая организация' },
  { value: 'other', label: 'Другая форма' },
]

export function readBusinessProfile(): BusinessProfile {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(businessProfileStorageKey) ?? 'null')
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return { ...emptyBusinessProfile }

    const fields = stored as Record<string, unknown>
    const stringValue = (key: keyof BusinessProfile) => typeof fields[key] === 'string' ? fields[key] : ''
    const numberValue = (key: 'employees' | 'annualRevenue') => {
      const value = stringValue(key)
      return value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? value : ''
    }
    const categoryId = stringValue('categoryId')
    const stage = stringValue('stage')
    const legalForm = stringValue('legalForm')

    return {
      name: stringValue('name'),
      categoryId: categories.some((category) => category.id === categoryId) ? categoryId : '',
      stage: Object.hasOwn(stageLabels, stage) ? stage : '',
      employees: numberValue('employees'),
      annualRevenue: numberValue('annualRevenue'),
      legalForm: legalForms.some((form) => form.value === legalForm) ? legalForm : '',
    }
  } catch {
    return { ...emptyBusinessProfile }
  }
}

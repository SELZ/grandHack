/** Profile stored by the backend; no independent browser persistence. */
export type BusinessProfile = {
  name: string
  categoryId: string
  stage: string
  employees: string
  annualRevenue: string
  legalForm: string
}

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

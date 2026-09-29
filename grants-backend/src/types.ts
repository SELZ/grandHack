// Mirrors src/entities/grant/model/types.ts on the React frontend, plus backend-only entities.

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

export type GrantRow = {
  id: string
  title: string
  org: string
  amount: number | null
  amountText: string
  deadlineISO: string | null
  deadlineText: string
  industries: string // JSON-encoded string[]
  regions: string // JSON-encoded string[]
  stages: string // JSON-encoded string[]
  summary: string
  requirements: string // JSON-encoded string[]
  notes: string // JSON-encoded string[]
  sphere: string
  url: string
  isNew: number // 0 | 1
}

// A user as identified by the MAX messenger ("user" object inside WebAppData).
export type User = {
  id: number
  max_user_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  created_at: string
}

export type BusinessProfile = {
  user_id: number
  name: string
  category_id: string
  stage: string
  employees: string
  annual_revenue: string
  legal_form: string
  updated_at: string
}

export type AuthedRequestUser = {
  userId: number
  maxUserId: number
}

// Parsed contents of the MAX Mini App "user" launch param.
export type MaxWebAppUser = {
  id: number
  first_name: string
  last_name?: string | null
  username?: string | null
  language_code?: string | null
  photo_url?: string | null
}

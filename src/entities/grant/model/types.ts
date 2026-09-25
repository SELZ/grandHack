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

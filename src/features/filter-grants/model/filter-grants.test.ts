import assert from 'node:assert/strict'
import test from 'node:test'
import type { Grant } from '@/entities/grant'
import { defaultGrantFilters, filterGrants } from './filter-grants'

function makeGrant(values: Partial<Grant>): Grant {
  return {
    id: 'grant',
    title: 'Программа поддержки',
    org: 'Фонд развития',
    amount: null,
    amountText: 'Размер поддержки уточняется',
    deadlineISO: null,
    deadlineText: 'Приём заявок',
    industries: ['agriculture'],
    regions: ['all'],
    stages: ['start'],
    summary: 'Поддержка бизнеса',
    requirements: [],
    notes: [],
    sphere: '',
    url: 'https://example.test/competition',
    isNew: false,
    ...values,
  }
}

test('combines all query terms, industry and business stage', () => {
  const grants = [
    makeGrant({ id: 'match', title: 'Оборудование фермы', stages: ['growth'] }),
    makeGrant({ id: 'wrong-stage', title: 'Оборудование фермы' }),
    makeGrant({ id: 'wrong-industry', title: 'Оборудование фермы', industries: ['food'], stages: ['growth'] }),
    makeGrant({ id: 'wrong-query', title: 'Развитие фермы', stages: ['growth'] }),
  ]

  assert.deepEqual(
    filterGrants(grants, { query: 'фермы оборудование', categoryId: 'agriculture', stage: 'growth' }).map(({ id }) => id),
    ['match'],
  )
})

test('universal industry programs match every category while retaining the stage filter', () => {
  const universal = makeGrant({ industries: ['any'], stages: ['growth'] })

  for (const categoryId of ['it', 'trade', 'agriculture', 'creative']) {
    assert.deepEqual(filterGrants([universal], { query: '', categoryId, stage: '' }), [universal])
    assert.deepEqual(filterGrants([universal], { query: '', categoryId, stage: 'start' }), [])
  }
})

test('search ignores case, whitespace and ё/е differences', () => {
  const grant = makeGrant({ title: 'Зелёная ферма', summary: 'Покупка оборудования' })

  assert.deepEqual(
    filterGrants([grant], { ...defaultGrantFilters, query: '  ЗЕЛЕНАЯ,   оборудован  ' }),
    [grant],
  )
})

test('search includes readable industry, region and stage labels', () => {
  const grant = makeGrant({ industries: ['agriculture'], regions: ['Москва'], stages: ['scale'] })

  assert.deepEqual(
    filterGrants([grant], { ...defaultGrantFilters, query: 'сельское москва масштабирование' }),
    [grant],
  )
})

test('IT and ИТ queries are equivalent and do not match unrelated URLs or words', () => {
  const digital = makeGrant({ id: 'digital', industries: ['it'] })
  const unrelated = makeGrant({ id: 'unrelated', title: 'Credit support', url: 'https://site.test/it-support' })

  for (const query of ['IT', 'ит']) {
    assert.deepEqual(
      filterGrants([digital, unrelated], { ...defaultGrantFilters, query }),
      [digital],
    )
  }
})

test('unknown amount remains null and its supplied amount text is searchable', () => {
  const grant = makeGrant({ amount: null, amountText: 'Зависит от региона' })
  const [result] = filterGrants([grant], { ...defaultGrantFilters, query: 'зависит региона' })

  assert.equal(result, grant)
  assert.equal(result.amount, null)
  assert.equal(result.amountText, 'Зависит от региона')
})

test('empty filters return all programs without changing source data', () => {
  const grants = Object.freeze([
    makeGrant({ id: 'first' }),
    makeGrant({ id: 'second', industries: ['it'] }),
  ])

  assert.deepEqual(filterGrants(grants, defaultGrantFilters), grants)
  assert.deepEqual(filterGrants(grants, { ...defaultGrantFilters, query: '   ' }), grants)
})

test('unmatched queries and stages produce empty results', () => {
  const grants = [makeGrant({})]

  assert.deepEqual(filterGrants(grants, { ...defaultGrantFilters, query: 'несуществующаяпрограмма' }), [])
  assert.deepEqual(filterGrants(grants, { ...defaultGrantFilters, stage: 'idea' }), [])
})

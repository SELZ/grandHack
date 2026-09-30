import { db } from '../db.js'
import type { Grant, GrantRow } from '../types.js'

const categoryAliases: [string, RegExp][] = [
  ['it', /(?:^|[^\p{L}\p{N}])(?:it|ит)(?=$|[^\p{L}\p{N}])|технолог|программир|цифров|инновац/u],
  ['trade', /торгов|экспорт|магазин/u],
  ['production', /производ|завод/u],
  ['agriculture', /сельск|ферм|агро/u],
  ['food', /общепит|ресторан|кафе|пекарн/u],
  ['services', /услуг|туризм|турист/u],
  ['education', /образован|обучен|школ/u],
  ['medicine', /медицин|клиник|здоров/u],
  ['construction', /строител/u],
  ['creative', /креатив|культур|искусств|дизайн/u],
]

const categories: Record<string, { label: string; industries: string[] }> = {
  it: { label: 'IT', industries: ['it', 'innovation'] },
  trade: { label: 'торговля', industries: ['trade', 'export'] },
  production: { label: 'производство', industries: ['production', 'innovation'] },
  agriculture: { label: 'сельское хозяйство', industries: ['agriculture'] },
  food: { label: 'общепит', industries: ['food'] },
  services: { label: 'услуги', industries: ['services', 'tourism'] },
  education: { label: 'образование', industries: ['education'] },
  medicine: { label: 'медицину', industries: ['medicine'] },
  construction: { label: 'строительство', industries: ['construction'] },
  creative: { label: 'креативные индустрии', industries: ['creative', 'culture'] },
}

const stopWords = new Set([
  'подбери', 'подберите', 'подобрать', 'покажи', 'покажите', 'найди', 'найти', 'найдите',
  'есть', 'какие', 'какой', 'хочу', 'нужен', 'нужны', 'мне', 'меня', 'для', 'грант',
  'гранты', 'грантов', 'грантовый', 'программа', 'программы', 'программ', 'бизнес',
  'бизнеса', 'пожалуйста', 'подходящие', 'подходящий',
])

function normalize(value: string) {
  return value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim()
}

function rowToGrant(row: GrantRow): Grant {
  return {
    ...row,
    industries: JSON.parse(row.industries) as string[],
    regions: JSON.parse(row.regions) as string[],
    stages: JSON.parse(row.stages) as string[],
    requirements: JSON.parse(row.requirements) as string[],
    notes: JSON.parse(row.notes) as string[],
    isNew: row.isNew === 1,
  }
}

export function answerGrantQuestion(message: string, userId: number) {
  const query = normalize(message).slice(0, 1000)
  const profile = db.prepare('SELECT category_id, stage FROM business_profiles WHERE user_id = ?').get(userId) as
    { category_id: string; stage: string } | undefined
  const profileCategory = categories[profile?.category_id ?? ''] ? profile!.category_id : 'all'
  const categoryId = categoryAliases.find(([, pattern]) => pattern.test(query))?.[0] ?? profileCategory
  const selectedCategory = categories[categoryId]
  const stage = ['idea', 'start', 'growth', 'scale'].includes(profile?.stage ?? '') ? profile!.stage : ''
  const grants = (db.prepare('SELECT * FROM grants').all() as GrantRow[]).map(rowToGrant)
  const eligible = grants.filter(grant => {
    const matchesCategory = !selectedCategory
      || grant.industries.includes('any')
      || grant.industries.some(industry => selectedCategory.industries.includes(industry))
    const matchesStage = !stage || grant.stages.includes(stage)
    return matchesCategory && matchesStage
  })

  if (/^(?:привет|здравствуй|добрый день|добрый вечер|спасибо)/u.test(query)) {
    return {
      text: 'Привет! Помогу подобрать гранты из каталога и разобраться в требованиях. Напишите сферу бизнеса или задайте вопрос, например про документы и софинансирование.',
      grantIds: [],
    }
  }

  if (query.includes('софинанс')) {
    const matches = eligible.filter(grant => grant.requirements.some(item => /софинанс/i.test(item))).slice(0, 3)
    return matches.length
      ? {
          text: `Нашёл условия софинансирования в программах из каталога:\n\n${matches.map(grant => `${grant.title}\n${grant.requirements.find(item => /софинанс/i.test(item))}`).join('\n\n')}\n\nПолные условия и актуальность уточните у организатора.`,
          grantIds: matches.map(grant => grant.id),
        }
      : { text: 'В требованиях подходящих программ не нашёл отдельных условий софинансирования. Проверьте полные правила на сайте организатора.', grantIds: [] }
  }

  if (/документ|требован|услови/u.test(query)) {
    const matches = eligible.slice(0, 3)
    return {
      text: 'Список документов зависит от выбранной программы. В карточках ниже собраны требования к участникам; полный перечень нужно проверить на сайте организатора.',
      grantIds: matches.map(grant => grant.id),
    }
  }

  const selection = /подбер|подбор|подобра|покаж|найди|найти|грант|программ/u.test(query)
  const requestedCategory = categoryAliases.some(([, pattern]) => pattern.test(query))
  const words = (query.match(/[\p{L}\p{N}]+/gu) ?? []).filter(word => word.length > 2 && !stopWords.has(word))
  const terms = words.map(word => word.replace(/(?:ами|ями|ого|ему|ыми|ими|ия|ие|ий|ая|ое|ые|ов|ах|ях|ам|ям|ом|ем|а|я|ы|и|у|ю|е|о)$/u, '')).filter(Boolean)
  const matches = eligible
    .map(grant => {
      const haystack = normalize([
        grant.title, grant.org, grant.summary, grant.sphere, grant.amountText,
        ...grant.requirements, ...grant.notes, ...grant.industries, ...grant.regions,
      ].join(' '))
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0)
      const industryMatch = selectedCategory?.industries.some(industry => grant.industries.includes(industry)) ? 1 : 0
      return { grant, score, industryMatch }
    })
    .filter(item => requestedCategory || !terms.length || item.score > 0)
    .sort((a, b) => b.score - a.score || b.industryMatch - a.industryMatch)
    .slice(0, 3)
    .map(item => item.grant)

  if (!matches.length || (!selection && !requestedCategory && !terms.length)) {
    return {
      text: 'Пока не нашёл подходящие программы. Укажите отрасль или название программы, например: «IT», «туризм» или «оборудование». Сферу и стадию бизнеса можно указать в профиле.',
      grantIds: [],
    }
  }

  const intro = selectedCategory
    ? `Подобрал программы по направлению «${selectedCategory.label}»`
    : 'Подобрал программы из каталога'
  return {
    text: `${intro}. В профиле учтена стадия бизнеса, если она указана. Откройте карточку, чтобы посмотреть требования; актуальные сроки уточняйте у организатора.`,
    grantIds: matches.map(grant => grant.id),
  }
}

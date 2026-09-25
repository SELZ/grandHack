import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { categories, stageLabels } from '@/entities/grant'
import { businessProfileStorageKey, emptyBusinessProfile, legalForms, readBusinessProfile } from '@/features/match-business/model/business-profile'
import type { BusinessProfile } from '@/features/match-business/model/business-profile'
import selectChevron from '@/shared/assets/profile/select-chevron.svg'
import { Button, Select } from '@/shared/ui'

type ProfileScreenProps = {
  onShowMatches: (categoryId: string, stage: string) => void
}

const fieldClass = 'profile-screen__field grid min-w-0 content-start gap-2'
const labelClass = 'text-sm font-semibold leading-5 text-[#e2e4e5]'
const controlClass = 'profile-screen__control block h-11 w-full min-w-0 rounded-xl border border-white/15 bg-black/10 px-3 text-base leading-5 text-[#e2e4e5] outline-none transition-colors placeholder:text-white/45 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10 focus:ring-offset-0 focus-visible:outline-none disabled:opacity-50 motion-reduce:transition-none lg:h-12 [color-scheme:dark]'
const selectClass = `${controlClass} cursor-pointer appearance-none pr-10 [&:has(option[value='']:checked)]:text-white/45 [&>option]:bg-[#273440] [&>option]:text-[#e2e4e5]`
const numberClass = `${controlClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`
const chevronClass = 'profile-screen__chevron pointer-events-none absolute right-4 top-1/2 max-w-none -translate-y-1/2'

export function ProfileScreen({ onShowMatches }: ProfileScreenProps) {
  const formId = useId()
  const [profile, setProfile] = useState(readBusinessProfile)
  const [notice, setNotice] = useState('')

  function updateField(key: keyof BusinessProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }))
    setNotice('')
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      localStorage.setItem(businessProfileStorageKey, JSON.stringify({ ...profile, name: profile.name.trim() }))
    } catch {
      setNotice('Не удалось сохранить профиль. Разрешите сохранение данных в браузере и попробуйте ещё раз.')
      return
    }
    onShowMatches(profile.categoryId || 'all', profile.stage)
  }

  function clearProfile() {
    setProfile({ ...emptyBusinessProfile })
    try {
      localStorage.removeItem(businessProfileStorageKey)
      setNotice('Форма очищена')
    } catch {
      setNotice('Форма очищена. Не удалось удалить сохранённые данные из браузера.')
    }
  }

  return (
    <main className="profile-screen relative z-1 mx-auto grid w-full max-w-7xl gap-6 px-4 pt-6 pb-[calc(97px+env(safe-area-inset-bottom,0px))] text-[#e2e4e5] md:px-8 md:pt-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:pb-12" aria-labelledby={`${formId}-title`}>
      <header className="profile-screen__intro min-w-0 rounded-2xl border border-white/10 bg-white/5 p-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:pt-2">
        <h1 id={`${formId}-title`} className="text-2xl font-semibold leading-tight lg:text-3xl">Ваш бизнес</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">Заполните профиль для точного подбора</p>
      </header>

      <form className="profile-screen__form w-full min-w-0 max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:p-6 lg:p-8" onSubmit={saveProfile}>
        <div className="profile-screen__fields grid min-w-0 gap-5 md:grid-cols-2 md:gap-x-6 md:gap-y-6">
          <div className={`${fieldClass} md:col-span-2`}>
            <label className={labelClass} htmlFor={`${formId}-name`}>Название бизнеса/проекта</label>
            <input
              id={`${formId}-name`}
              name="businessName"
              className={controlClass}
              autoComplete="organization"
              maxLength={120}
              value={profile.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Например, «Кофейня на Садовой»"
            />
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor={`${formId}-category`}>Сфера деятельности</label>
            <div className="profile-screen__select relative min-w-0">
              <Select
                id={`${formId}-category`}
                name="category"
                className={selectClass}
                value={profile.categoryId}
                onChange={(event) => updateField('categoryId', event.target.value)}
              >
                <option value="">Выберите сферу</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.id === 'all' ? 'Все сферы' : category.label}
                  </option>
                ))}
              </Select>
              <img className={chevronClass} src={selectChevron} alt="" />
            </div>
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor={`${formId}-stage`}>Стадия бизнеса</label>
            <div className="profile-screen__select relative min-w-0">
              <Select
                id={`${formId}-stage`}
                name="stage"
                className={selectClass}
                value={profile.stage}
                onChange={(event) => updateField('stage', event.target.value)}
              >
                <option value="">Выберите этап развития</option>
                {Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <img className={chevronClass} src={selectChevron} alt="" />
            </div>
          </div>

          <div className="profile-screen__numbers grid min-w-0 grid-cols-2 gap-4 md:col-span-2 md:gap-6">
            <div className={fieldClass}>
              <label className={labelClass} htmlFor={`${formId}-employees`}>Кол-во сотрудников</label>
              <input
                id={`${formId}-employees`}
                name="employees"
                className={numberClass}
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={profile.employees}
                onChange={(event) => updateField('employees', event.target.value)}
                placeholder="0"
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass} htmlFor={`${formId}-revenue`}>Годовой доход, ₽</label>
              <input
                id={`${formId}-revenue`}
                name="annualRevenue"
                className={numberClass}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={profile.annualRevenue}
                onChange={(event) => updateField('annualRevenue', event.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className={`${fieldClass} md:col-span-2`}>
            <label className={labelClass} htmlFor={`${formId}-legal-form`}>Правовая форма</label>
            <div className="profile-screen__select relative min-w-0">
              <Select
                id={`${formId}-legal-form`}
                name="legalForm"
                className={selectClass}
                value={profile.legalForm}
                onChange={(event) => updateField('legalForm', event.target.value)}
              >
                <option value="">Выберите форму</option>
                {legalForms.map((form) => <option key={form.value} value={form.value}>{form.label}</option>)}
              </Select>
              <img className={chevronClass} src={selectChevron} alt="" />
            </div>
          </div>
        </div>

        <div className="profile-screen__actions mt-6 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2 lg:mt-8">
          <Button type="submit" className="profile-screen__save h-11 w-full rounded-xl lg:h-12" data-ui-motion>Сохранить профиль</Button>
          <Button variant="secondary" className="profile-screen__clear h-11 w-full rounded-xl lg:h-12" data-ui-motion onClick={clearProfile}>Очистить форму</Button>
        </div>
        <p className="profile-screen__notice mt-4 text-sm leading-6 text-white/70 empty:hidden" role="status" aria-live="polite">{notice}</p>
      </form>
    </main>
  )
}

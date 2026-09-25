import { useId } from 'react'
import { categories, stageLabels } from '@/entities/grant'
import { Icon, IconButton, Select } from '@/shared/ui'
import type { GrantFiltersValue } from '../model/filter-grants'

type GrantFiltersProps = {
  filters: GrantFiltersValue
  onQueryChange: (query: string) => void
  onCategoryChange: (categoryId: string) => void
  onStageChange: (stage: string) => void
  onReset: () => void
}

export function GrantFilters({
  filters,
  onQueryChange,
  onCategoryChange,
  onStageChange,
  onReset,
}: GrantFiltersProps) {
  const stageSelectId = useId()
  const hasFilters = Boolean(filters.query.trim() || filters.categoryId !== 'all' || filters.stage)

  return (
    <section className="mt-5 space-y-5" aria-label="Поиск и фильтры грантов">
      <div className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-white/20 bg-white/5 px-3 text-muted transition-colors focus-within:border-white/45 focus-within:ring-2 focus-within:ring-white/10 motion-reduce:transition-none">
        <Icon name="search" className="size-[22px] shrink-0" />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none ring-0 placeholder:text-muted focus-visible:outline-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
          type="search"
          value={filters.query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск: IT, агро, оборудование…"
          aria-label="Поиск грантов"
        />
        {filters.query && (
          <IconButton
            className="-mr-1.5 size-[30px]"
            onClick={() => onQueryChange('')}
            aria-label="Очистить поиск"
          >
            <Icon name="close" className="size-[18px]" />
          </IconButton>
        )}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Отрасль бизнеса"
      >
        {categories.map((category) => (
          <button
            type="button"
            data-ui-motion
            className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-3 py-2 text-sm leading-5 font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/30 motion-reduce:transition-none ${
              filters.categoryId === category.id
                ? 'border-white/40 bg-white/20 text-white'
                : 'border-white/15 bg-white/5 text-foreground/80 hover:border-white/30 hover:bg-white/10'
            }`}
            key={category.id}
            aria-pressed={filters.categoryId === category.id}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-2 text-sm font-semibold text-foreground/80">
          <label htmlFor={stageSelectId}>Этап бизнеса</label>
          <Select
            id={stageSelectId}
            className="w-full"
            value={filters.stage}
            onChange={(event) => onStageChange(event.target.value)}
          >
            <option value="">Любой этап</option>
            {Object.entries(stageLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <button
            type="button"
            className="min-h-11 cursor-pointer rounded-lg px-2 py-2 text-sm font-semibold text-foreground/80 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 motion-reduce:transition-none"
            onClick={onReset}
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </section>
  )
}

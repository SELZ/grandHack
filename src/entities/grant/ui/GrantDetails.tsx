import { useId, useState } from 'react'
import { Icon, IconButton } from '@/shared/ui'
import { useDialogMotion } from '@/shared/lib/use-dialog-motion'
import savedFavoriteIcon from '@/shared/assets/catalog/star-filled.svg'
import { getRegionLabel, stageLabels } from '../model/catalogs'
import type { Grant } from '../model/types'
import favoriteIcon from '../assets/detail-favorite.svg'

type GrantDetailsProps = {
  grant: Grant | null
  onClose: () => void
  saved?: boolean
  onToggleFavorite?: () => void
}

const compactStageLabels: Record<string, string> = {
  idea: 'Идея',
  start: 'Запуск',
  growth: 'Рост',
  scale: 'Масштабирование',
}

const tagClasses = 'inline-flex min-h-7 max-w-full items-center justify-center rounded-full border border-white/25 bg-white/20 px-4 py-1 text-xs leading-[17px] text-[#e2e4e5]'
const sectionClasses = 'text-[15px] leading-tight text-[#e2e4e5]/80 [overflow-wrap:anywhere]'
const sectionTitleClasses = 'text-sm font-semibold leading-[22px] text-[#e2e4e5]'

export function GrantDetails({ grant, ...props }: GrantDetailsProps) {
  const [retainedGrant, setRetainedGrant] = useState(grant)
  if (grant && retainedGrant !== grant) setRetainedGrant(grant)

  return retainedGrant ? <GrantDetailsDialog grant={retainedGrant} open={grant !== null} {...props} /> : null
}

function GrantDetailsDialog({ grant, open, onClose, saved = false, onToggleFavorite }: Omit<GrantDetailsProps, 'grant'> & { grant: Grant; open: boolean }) {
  const titleId = useId()
  const descriptionId = useId()
  const { dialogRef, panelRef, requestClose, dialogHandlers } = useDialogMotion({ open, onClose })

  return (
    <dialog
      ref={dialogRef}
      className="grant-details fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none items-end justify-center overflow-hidden border-0 bg-transparent p-0 font-sans text-[#e2e4e5] outline-none [--dialog-backdrop-opacity:0] open:flex backdrop:bg-black/65 backdrop:opacity-[var(--dialog-backdrop-opacity)] md:items-center md:p-8"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      {...dialogHandlers}
    >
      <div
        ref={panelRef}
        data-dialog-panel
        className="relative max-h-[calc(100dvh-24px)] w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl border border-b-0 border-white/10 bg-black/85 shadow-2xl backdrop-blur-sm md:max-h-[calc(100dvh-64px)] md:max-w-[760px] md:rounded-3xl md:border-b"
      >
        <IconButton
          className="absolute top-16 right-4 size-8 p-0! text-[#e2e4e5]/70 md:top-[74px] md:right-7"
          onClick={requestClose}
          aria-label="Закрыть подробности гранта"
        >
          <Icon name="close" />
        </IconButton>

        <div className="flex min-w-0 flex-col px-4 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] md:p-8">
          <header className="relative flex h-6 shrink-0 items-center gap-2">
            <p className="min-w-0 flex-1 overflow-hidden text-[13px] leading-snug whitespace-nowrap [mask-image:linear-gradient(to_right,#000_74%,transparent)]" title={grant.org}>
              {grant.org}
            </p>
            {onToggleFavorite && (
              <IconButton
                className="-mr-2 h-8 w-7 p-0!"
                aria-label={saved ? 'Убрать грант из избранного' : 'Добавить грант в избранное'}
                aria-pressed={saved}
                onClick={onToggleFavorite}
              >
                <img src={saved ? savedFavoriteIcon : favoriteIcon} alt="" className="block" />
              </IconButton>
            )}
          </header>

          <h2 id={titleId} className="mt-3.5 min-h-12 pr-10 text-lg leading-tight font-semibold [overflow-wrap:anywhere] md:mt-4.5 md:min-h-0">
            {grant.title}
          </h2>

          <div className="mt-3.5 flex items-start gap-3.5 md:mt-6 md:grid md:grid-cols-2 md:gap-8">
            <p className="min-w-0 flex-1 text-sm leading-[21px] font-semibold [overflow-wrap:anywhere]">{grant.amountText}</p>
            <p className="min-w-0 flex-1 pt-0.5 text-xs leading-[19px] [overflow-wrap:anywhere]">{grant.deadlineText}</p>
          </div>

          <section className={`mt-5 md:mt-6 ${sectionClasses}`}>
            <h3 className={sectionTitleClasses}>Допустимые расходы</h3>
            <p id={descriptionId}>{grant.summary}</p>
          </section>

          {grant.requirements.length > 0 && (
            <section className={`mt-5 md:mt-6 ${sectionClasses}`}>
              <h3 className={`pl-1.5 ${sectionTitleClasses}`}>Требования</h3>
              <ul className="list-disc pl-6">
                {grant.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
              </ul>
            </section>
          )}

          {grant.notes.length > 0 && (
            <section className={`mt-4 md:mt-6 ${sectionClasses}`}>
              <h3 className={`pl-1.5 ${sectionTitleClasses}`}>Важные особенности</h3>
              <ul className="list-disc pl-6">
                {grant.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </section>
          )}

          <footer className="mt-5 md:mt-7 md:grid md:grid-cols-[minmax(0,1fr)_minmax(190px,240px)] md:items-end md:gap-6">
            <div className="flex flex-wrap gap-2.5">
              {grant.stages.length > 0 && (
                <span className={tagClasses}>
                  {grant.stages.map((stage) => compactStageLabels[stage] ?? stageLabels[stage] ?? stage).join(', ')}
                </span>
              )}
              {grant.regions.map((region) => (
                <span key={region} className={tagClasses}>{getRegionLabel(region)}</span>
              ))}
            </div>
            <a
              className="mt-6 flex min-h-13 items-center justify-center rounded-2xl border border-white/20 bg-[#536879]/70 px-4 py-2.5 text-center text-lg leading-[25px] font-semibold text-[#e2e4e5] no-underline outline-none transition-colors hover:bg-[#536879]/90 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 motion-reduce:transition-none md:mt-0"
              href={grant.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Перейти к подаче
            </a>
          </footer>
        </div>
      </div>
    </dialog>
  )
}

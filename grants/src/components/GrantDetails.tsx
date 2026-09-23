import { useEffect, useId, useRef } from 'react'
import {
  type Grant,
  getRegionLabel,
  industryLabels,
  stageLabels,
} from '../data/grants'
import './GrantDetails.css'

type GrantDetailsProps = {
  grant: Grant | null
  onClose: () => void
}

export function GrantDetails({ grant, onClose }: GrantDetailsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!grant || !dialog) return

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [grant])

  if (!grant) return null

  return (
    <dialog
      ref={dialogRef}
      className="grant-details"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          onClose()
        }
      }}
    >
      <div className="grant-details-content">
        <button
          type="button"
          className="grant-details-close"
          aria-label="Закрыть подробности гранта"
          onClick={onClose}
          autoFocus
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <header className="grant-details-header">
          <p className="grant-details-org">{grant.org}</p>
          <h2 id={titleId} className="grant-details-title">{grant.title}</h2>
        </header>

        <p id={descriptionId} className="grant-details-summary">{grant.summary}</p>

        <dl className="grant-details-facts">
          <div className="grant-details-fact grant-details-funding">
            <dt>Размер поддержки</dt>
            <dd>{grant.amountText}</dd>
          </div>
          <div className="grant-details-fact">
            <dt>Приём заявок</dt>
            <dd>{grant.deadlineText}</dd>
          </div>
          <div className="grant-details-fact">
            <dt>Сфера деятельности</dt>
            <dd>{grant.sphere}</dd>
          </div>
          <div className="grant-details-fact">
            <dt>Отрасли</dt>
            <dd className="grant-details-tags">
              {grant.industries.map((industry) => (
                <span className="grant-details-tag" key={industry}>
                  {industryLabels[industry] ?? industry}
                </span>
              ))}
            </dd>
          </div>
          <div className="grant-details-fact">
            <dt>Регионы</dt>
            <dd className="grant-details-tags">
              {grant.regions.map((region) => (
                <span className="grant-details-tag" key={region}>
                  {getRegionLabel(region)}
                </span>
              ))}
            </dd>
          </div>
          <div className="grant-details-fact">
            <dt>Стадия бизнеса</dt>
            <dd className="grant-details-tags">
              {grant.stages.map((stage) => (
                <span className="grant-details-tag" key={stage}>
                  {stageLabels[stage] ?? stage}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        {grant.requirements.length > 0 && (
          <section className="grant-details-section">
            <h3>Кто может участвовать</h3>
            <ul>
              {grant.requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </section>
        )}

        {grant.notes.length > 0 && (
          <section className="grant-details-section">
            <h3>Дополнительные условия</h3>
            <ul>
              {grant.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </section>
        )}

        <a
          className="grant-details-link"
          href={grant.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Сайт организатора
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 4h6v6M20 4 10 14" />
            <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
          </svg>
        </a>
      </div>
    </dialog>
  )
}

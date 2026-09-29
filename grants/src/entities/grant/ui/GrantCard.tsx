import type { ReactNode } from 'react'
import { getRegionLabel, industryLabels } from '../model/catalogs'
import type { Grant } from '../model/types'

type GrantCardProps = { grant: Grant; favoriteAction?: ReactNode; onOpen: () => void }

export function GrantCard({ grant, favoriteAction, onOpen }: GrantCardProps) {
  return (
    <article className="grant-card glass-surface" aria-labelledby={`title-${grant.id}`}>
      <button type="button" className="grant-card-open" onClick={onOpen} aria-label={`Подробнее о гранте: ${grant.title}`} />
      <div className="grant-card-heading">
        <p className="grant-card-org" title={grant.org}>{grant.org}</p>
        {favoriteAction}
      </div>
      <h2 id={`title-${grant.id}`} className="grant-card-title">{grant.title}</h2>
      <p className="grant-card-summary">{grant.summary}</p>
      <div className="grant-card-tags">
        {grant.industries.map((industry) => <span key={industry}>{industryLabels[industry] ?? industry}</span>)}
        {grant.regions.map((region) => <span key={`region-${region}`}>{getRegionLabel(region)}</span>)}
      </div>
      <div className="grant-card-funding">
        <p>{grant.amountText}</p>
        <span>{grant.deadlineText}</span>
      </div>
    </article>
  )
}

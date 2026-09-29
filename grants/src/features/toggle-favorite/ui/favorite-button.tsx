import starIcon from '@/shared/assets/catalog/star.svg'
import filledStarIcon from '@/shared/assets/catalog/star-filled.svg'

type FavoriteButtonProps = {
  grantId: string
  grantTitle: string
  saved: boolean
  onToggle: () => void
}

export function FavoriteButton({ grantId, grantTitle, saved, onToggle }: FavoriteButtonProps) {
  return (
    <button type="button" data-grant-id={grantId} className="grant-favorite" onClick={onToggle}
      aria-label={`${saved ? 'Убрать из избранного' : 'Добавить в избранное'}: ${grantTitle}`} aria-pressed={saved}>
      <img src={saved ? filledStarIcon : starIcon} alt="" />
    </button>
  )
}

import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { categories, stageLabels } from '@/entities/grant'
import { Button, Modal, Select } from '@/shared/ui'

type BusinessProfileDialogProps = {
  open: boolean
  categoryId: string
  stage: string
  onApply: (categoryId: string, stage: string) => void
  onClose: () => void
}

function BusinessProfileForm({ categoryId, stage, onApply }: Pick<BusinessProfileDialogProps, 'categoryId' | 'stage' | 'onApply'>) {
  const industryId = useId()
  const stageId = useId()
  const [draftCategory, setDraftCategory] = useState(categoryId)
  const [draftStage, setDraftStage] = useState(stage)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply(draftCategory, draftStage)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
      <div className="grid gap-2">
        <label htmlFor={industryId} className="text-sm font-semibold">Отрасль</label>
        <Select id={industryId} name="industry" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.id === 'all' ? 'Все отрасли' : category.label}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2">
        <label htmlFor={stageId} className="text-sm font-semibold">Этап развития</label>
        <Select id={stageId} name="stage" value={draftStage} onChange={(event) => setDraftStage(event.target.value)}>
          <option value="">Любой этап</option>
          {Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </div>
      <Button type="submit" className="mt-1">Показать программы</Button>
    </form>
  )
}

export function BusinessProfileDialog({ open, categoryId, stage, onApply, onClose }: BusinessProfileDialogProps) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Modal open={open} onClose={onClose} titleId={titleId} descriptionId={descriptionId} closeLabel="Закрыть профиль" className="max-w-[480px]">
      <span className="mb-5 block text-[32px] leading-none" aria-hidden="true">🎯</span>
      <h2 id={titleId} className="pr-6 text-[26px] font-bold leading-tight">О вашем бизнесе</h2>
      <p id={descriptionId} className="mt-3 leading-relaxed text-muted">Выберите отрасль и этап развития — покажем программы по этим параметрам.</p>
      {open && (
        <BusinessProfileForm
          key={`${categoryId}:${stage}`}
          categoryId={categoryId}
          stage={stage}
          onApply={onApply}
        />
      )}
    </Modal>
  )
}

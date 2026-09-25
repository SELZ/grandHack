import { useId } from 'react'
import { Button } from '@/shared/ui'

type BusinessProfileBannerProps = {
  onOpen: () => void
}

export function BusinessProfileBanner({ onOpen }: BusinessProfileBannerProps) {
  const titleId = useId()

  return (
    <section
      className="mt-5 flex min-h-[84px] flex-wrap items-center gap-3 rounded-[19px] border border-[#263f5d] bg-linear-[105deg,#172737,#1e1c34] p-[18px] sm:mt-[27px] sm:flex-nowrap sm:gap-5 sm:rounded-[23px] sm:py-[15px] sm:pr-5 sm:pl-6"
      aria-labelledby={titleId}
    >
      <span className="shrink-0 text-[26px] leading-none" aria-hidden="true">🎯</span>
      <div className="min-w-0 flex-1 basis-[calc(100%_-_44px)] sm:basis-auto">
        <h2 id={titleId} className="text-[17px] leading-[1.3] font-bold sm:text-xl">Подобрать под ваш бизнес</h2>
        <p className="mt-[5px] text-[13px] leading-normal font-semibold text-muted sm:mt-[3px] sm:text-base sm:leading-[1.4]">Заполните профиль — покажем, какие гранты подходят именно вам</p>
      </div>
      <Button type="button" className="mt-[3px] w-full sm:mt-0 sm:w-auto" onClick={onOpen}>Заполнить</Button>
    </section>
  )
}

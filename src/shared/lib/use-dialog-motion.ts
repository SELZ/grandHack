import { useCallback, useLayoutEffect, useRef } from 'react'
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from 'react'
import { gsap } from 'gsap'

type DialogMotionOptions = {
  open: boolean
  onClose: () => void
  onAfterClose?: () => void
}

type DialogControls = { show: () => void; close: (notifyParent: boolean) => void }

let scrollLocks = 0
let originalBodyOverflow = ''

function lockBodyScroll() {
  if (scrollLocks === 0) {
    originalBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLocks += 1
  let released = false
  return () => {
    if (released) return
    released = true
    scrollLocks -= 1
    if (scrollLocks === 0) document.body.style.overflow = originalBodyOverflow
  }
}

const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useDialogMotion({ open, onClose, onAfterClose }: DialogMotionOptions) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<DialogControls | null>(null)
  const callbacksRef = useRef({ onClose, onAfterClose })
  const pointerStartedOutside = useRef(false)

  useLayoutEffect(() => {
    callbacksRef.current = { onClose, onAfterClose }
  }, [onClose, onAfterClose])

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const panel = panelRef.current
    if (!dialog || !panel) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timeline: gsap.core.Timeline | null = null
    let phase: 'closed' | 'opening' | 'open' | 'closing' = 'closed'
    let restoreScroll: (() => void) | null = null
    let previousFocus: Element | null = null
    let notifyAfterExit = false

    function releaseDialog() {
      dialog!.close()
      restoreScroll?.()
      restoreScroll = null
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
      previousFocus = null
    }

    function finishClose() {
      phase = 'closed'
      timeline = null
      const notifyParent = notifyAfterExit
      notifyAfterExit = false
      releaseDialog()
      callbacksRef.current.onAfterClose?.()
      if (notifyParent) callbacksRef.current.onClose()
    }

    function show() {
      if (phase === 'open' || phase === 'opening') return
      timeline?.kill()
      notifyAfterExit = false
      if (!dialog!.open) {
        previousFocus = document.activeElement
        restoreScroll = lockBodyScroll()
        gsap.set(panel, { opacity: 0, y: reducedMotion.matches ? 0 : 20, scale: reducedMotion.matches ? 1 : 0.98 })
        gsap.set(dialog, { '--dialog-backdrop-opacity': 0 })
        dialog!.showModal()
        dialog!.focus({ preventScroll: true })
      }
      phase = 'opening'
      if (reducedMotion.matches) {
        gsap.set(panel, { opacity: 1, clearProps: 'transform' })
        gsap.set(dialog, { '--dialog-backdrop-opacity': 1 })
        phase = 'open'
        timeline = null
        return
      }
      timeline = gsap.timeline({ onComplete: () => {
        phase = 'open'
        timeline = null
        gsap.set(panel, { clearProps: 'transform' })
      } })
        .to(panel, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' }, 0)
        .to(dialog, { '--dialog-backdrop-opacity': 1, duration: 0.25, ease: 'power2.out' }, 0)
    }

    function close(notifyParent: boolean) {
      if (!dialog!.open || phase === 'closed') return
      notifyAfterExit ||= notifyParent
      if (phase === 'closing') return
      timeline?.kill()
      phase = 'closing'
      if (reducedMotion.matches) {
        gsap.set(panel, { opacity: 0, clearProps: 'transform' })
        gsap.set(dialog, { '--dialog-backdrop-opacity': 0 })
        finishClose()
        return
      }
      timeline = gsap.timeline({ onComplete: finishClose })
        .to(panel, { opacity: 0, y: 12, scale: 0.98, duration: 0.2, ease: 'power2.in' }, 0)
        .to(dialog, { '--dialog-backdrop-opacity': 0, duration: 0.2, ease: 'power2.in' }, 0)
    }

    function handleMotionPreference() {
      if (!reducedMotion.matches) return
      timeline?.progress(1)
      if (dialog!.open) gsap.set(panel, { clearProps: 'transform' })
    }

    controlsRef.current = { show, close }
    reducedMotion.addEventListener('change', handleMotionPreference)

    return () => {
      controlsRef.current = null
      timeline?.kill()
      gsap.killTweensOf([dialog, panel])
      reducedMotion.removeEventListener('change', handleMotionPreference)
      if (dialog.open) releaseDialog()
      gsap.set(panel, { clearProps: 'opacity,transform' })
      dialog.style.removeProperty('--dialog-backdrop-opacity')
    }
  }, [])

  useLayoutEffect(() => {
    if (open) controlsRef.current?.show()
    else controlsRef.current?.close(false)
  }, [open])

  const requestClose = useCallback(() => controlsRef.current?.close(true), [])

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    requestClose()
  }

  function onPointerDown(event: MouseEvent<HTMLDialogElement>) {
    pointerStartedOutside.current = event.target === event.currentTarget
  }

  function onClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && pointerStartedOutside.current) requestClose()
    pointerStartedOutside.current = false
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
      .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (!first || !last) {
      event.preventDefault()
      dialogRef.current?.focus()
    } else if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return { dialogRef, panelRef, requestClose, dialogHandlers: { onCancel, onPointerDown, onClick, onKeyDown } }
}

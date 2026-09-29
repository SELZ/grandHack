type MaxBridge = {
  initData: string
  BackButton?: { show: () => void; hide: () => void; onClick: (callback: () => void) => void; offClick: (callback: () => void) => void }
  openLink?: (url: string) => void
}
declare global { interface Window { WebApp?: MaxBridge } }

// Capture before hash-based navigation can replace MAX's launch fragment.
const launch = new URLSearchParams(window.location.hash.slice(1))
const launchValues = launch.getAll('WebAppData')
const duplicateLaunch = new Set(launch.keys()).size !== [...launch.keys()].length
const rawInitData = launchValues[0] ?? window.WebApp?.initData ?? ''
const launchedInMax = launch.has('WebAppData') || launch.has('WebAppPlatform') || Boolean(window.WebApp?.initData)
let bridgePromise: Promise<void> | undefined

export async function maxInitData(): Promise<string> {
  if (duplicateLaunch) throw new Error('Некорректные параметры запуска MAX. Откройте приложение заново.')
  if (!launchedInMax) return ''
  if (!window.WebApp) {
    bridgePromise ??= new Promise<void>((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://st.max.ru/js/max-web-app.js'
      const timer = window.setTimeout(resolve, 5000)
      const finish = () => { window.clearTimeout(timer); resolve() }
      script.onload = finish
      script.onerror = finish
      document.head.append(script)
    })
    await bridgePromise
  }
  const data = window.WebApp?.initData || rawInitData
  if (!data) throw new Error('MAX не передал данные входа. Откройте приложение через кнопку бота.')
  return data
}

export function openExternalLink(event: { preventDefault: () => void }, url: string) {
  if (window.WebApp?.openLink) { event.preventDefault(); window.WebApp.openLink(url) }
}

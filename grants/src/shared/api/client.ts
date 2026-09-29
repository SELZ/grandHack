const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let response: Response
  try {
    const timeout = AbortSignal.timeout(15000)
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
    response = await fetch(`${apiBase}${path}`, { ...options, headers, signal })
  } catch {
    throw new Error('Нет связи с сервером. Проверьте, что бэкенд запущен, и повторите попытку.')
  }
  if (!response.ok) {
    if (response.status === 401) throw new Error('Сессия истекла или данные MAX не подтверждены. Откройте приложение заново.')
    if (response.status === 403) throw new Error('Вход доступен через MAX. Для локальной разработки включите ALLOW_DEV_AUTH.')
    throw new Error(`Сервер не выполнил запрос (${response.status}). Повторите попытку.`)
  }
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('API вернул не JSON. Проверьте адрес бэкенда и proxy.')
  return response.json() as Promise<T>
}

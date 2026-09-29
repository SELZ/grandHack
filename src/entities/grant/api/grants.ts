import { apiRequest } from '@/shared/api/client'
import type { Grant } from '../model/types'

export async function fetchGrants(signal?: AbortSignal): Promise<Grant[]> {
  const response = await apiRequest<{ grants: Grant[] }>('/grants', { signal })
  if (!Array.isArray(response.grants)) throw new Error('Сервер вернул некорректный каталог грантов')
  return response.grants
}

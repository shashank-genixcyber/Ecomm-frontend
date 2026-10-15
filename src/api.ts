export type DemoResult = {
  consumer_id: string; consumer_name: string; credential_type: string; credential_name: string
  credential_version: string | null; fingerprint: string | null; fingerprint_basis: string | null
  retrieved_at: string | null; retrieval_duration_ms: number | null; operation: string
  status: 'success' | 'failure'; error_code: string | null; duration_ms: number
  issuance_id: string | null; issuance_source: string; issuance_source_type: string; source_simulated: boolean
  issued_at: string | null; expires_at: string | null; ttl_seconds: number | null; remaining_ttl_seconds: number | null
  intentional_value_logging?: boolean; credential_value_logged?: boolean
}
export type DemoRun = { request_id: string; run_id: string; results: DemoResult[]; summary: { succeeded: number; failed: number } }

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${path}/`, { credentials: 'same-origin', ...options })
  let data
  try { data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null }
  catch { data = null }
  if (data?.results && data?.run_id) window.dispatchEvent(new CustomEvent<DemoRun>('demo-results', { detail: data }))
  if (!response.ok) {
    const correlation = data?.request_id ? ` Reference: ${data.request_id}` : ''
    const message = typeof data?.detail === 'string' ? data.detail : 'We couldn’t complete that request. Please try again.'
    const error = new ApiError(message + correlation, response.status)
    if (response.status === 403) window.dispatchEvent(new Event('session-recheck'))
    throw error
  }
  if (data === null) throw new ApiError('The server returned an unexpected response. Please try again.', response.status)
  return data as T
}

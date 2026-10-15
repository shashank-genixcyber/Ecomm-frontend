import { useEffect, useState } from 'react'
import { api, type DemoResult, type DemoRun } from './api'

type Service = { id: string; name: string; credential_type: string; credential_name: string; trigger: string; operation: string; issuance_source: string }
const categories = [
  { type: 'secret', title: 'Secrets', action: 'Run Secrets' },
  { type: 'certificate', title: 'Certificates', action: 'Run Certificates' },
  { type: 'key', title: 'Keys', action: 'Run Keys' },
  { type: 'oauth_token', title: 'OAuth tokens', action: 'Run OAuth Tokens' },
]
const loggingApis = [
  { type: 'secret', id: 'log-exposure-secret', name: 'Secret logging API', action: 'Run Secret Logging API', credential: 'log-exposure-demo-secret' },
  { type: 'key', id: 'log-exposure-key', name: 'Key logging API', action: 'Run Key Logging API', credential: 'log-exposure-demo-signing-key' },
]

export default function DemoPanel({ authenticated, csrfToken, busy, exclusive, signIn }: {
  authenticated: boolean; csrfToken: string; busy: boolean
  exclusive: (work: () => Promise<void>) => Promise<void>; signIn: () => void
}) {
  const [services, setServices] = useState<Service[]>([])
  const [results, setResults] = useState<Record<string, DemoResult>>({})
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [runId, setRunId] = useState('')

  async function loadServices() {
    try { setServices((await api<{ services: Service[] }>('demo/services')).services); setError('') }
    catch (reason) { setError((reason as Error).message) }
  }
  useEffect(() => { void loadServices() }, [])
  useEffect(() => {
    const receive = (event: Event) => {
      const run = (event as CustomEvent<DemoRun>).detail
      setResults(current => ({ ...current, ...Object.fromEntries(run.results.map(result => [result.consumer_id, result])) }))
      setSummary(`${run.summary.succeeded} succeeded · ${run.summary.failed} failed`)
      setRunId(run.run_id)
    }
    window.addEventListener('demo-results', receive)
    return () => window.removeEventListener('demo-results', receive)
  }, [])

  function run(type?: string, id?: string) {
    if (!authenticated) { signIn(); return }
    void exclusive(async () => {
      setError('')
      try {
        await api<DemoRun>(id ? `demo/services/${id}/run` : 'demo/run', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
          body: JSON.stringify(type ? { credential_type: type } : {}),
        })
      } catch (reason) { setError((reason as Error).message) }
    })
  }

  function runLoggingApi(type: string) {
    if (!authenticated) { signIn(); return }
    void exclusive(async () => {
      setError('')
      try {
        await api<DemoRun>(`demo/exposure/${type}/run`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
          body: '{}',
        })
      } catch (reason) { setError((reason as Error).message) }
    })
  }

  return <section className="credential-demo" aria-labelledby="credential-demo-title">
    <div className="demo-heading"><div><span className="eyebrow">LOCAL CREDENTIAL DEMO</span><h2 id="credential-demo-title">12 consumers. One shared log.</h2>
      <p>Every run retrieves and uses a credential. Shopping actions run these checks automatically.</p></div>
      <button className="primary-button" onClick={() => run()} disabled={busy || services.length !== 12}>Run All</button></div>
    {!authenticated && <p>Sign in with Local Demo to run individual consumers or credential groups.</p>}
    {error && <div className="demo-error" role="alert">{error}{services.length === 0 && <button onClick={() => void loadServices()}>Retry loading services</button>}</div>}
    {summary && <p className="demo-run-summary" role="status">{summary} <span>Run {runId}</span></p>}
    <div className="demo-groups">{categories.map(category => <section className="demo-group" key={category.type} aria-label={category.title}>
      <div className="demo-group-heading"><h3>{category.title}</h3><button className="sign-in" disabled={busy || !services.length} onClick={() => run(category.type)}>{category.action}</button></div>
      {services.filter(service => service.credential_type === category.type).map(service => {
        const result = results[service.id]
        return <article className="demo-service" key={service.id} data-consumer={service.id}>
          <div className="demo-service-heading"><h4>{service.name}</h4><button onClick={() => run(undefined, service.id)} disabled={busy} aria-label={`Run ${service.name}`}>Run</button></div>
          <dl><dt>Credential</dt><dd>{service.credential_name}</dd><dt>Demo source</dt><dd>{result?.issuance_source || service.issuance_source}</dd><dt>Shopping trigger</dt><dd>{service.trigger}</dd>
            <dt>Operation</dt><dd>{service.operation}</dd><dt>Outcome</dt><dd className={`demo-outcome ${result?.status || ''}`}>{result ? `${result.status}${result.error_code ? ` · ${result.error_code}` : ''}` : 'Not run manually yet'}</dd>
            {result && <><dt>Issued at</dt><dd>{result.issued_at || 'Unknown'}</dd><dt>Expires at</dt><dd>{result.expires_at || 'Unknown'}</dd>
              <dt>Issued TTL</dt><dd>{result.ttl_seconds === null ? 'Unknown' : `${result.ttl_seconds} s`}</dd>
              <dt>Remaining TTL</dt><dd>{result.remaining_ttl_seconds === null ? 'Unknown' : `${result.remaining_ttl_seconds} s at retrieval`}</dd>
              <dt>Retrieved at</dt><dd>{result.retrieved_at || 'Unavailable'}</dd><dt>Retrieval time</dt><dd>{result.retrieval_duration_ms ?? '—'} ms</dd>
              <dt>Version</dt><dd>{result.credential_version || 'Unknown'}</dd><dt>SHA-256 fingerprint</dt><dd className="demo-fingerprint">{result.fingerprint || 'Unknown'}</dd><dt>Fingerprint basis</dt><dd>{result.fingerprint_basis || 'Unknown'}</dd></>}
          </dl>
        </article>
      })}
    </section>)}</div>
    <section className="demo-exposure" aria-labelledby="demo-exposure-title">
      <h3 id="demo-exposure-title">Credential values in logs</h3>
      <p>These two APIs intentionally write their dedicated demo secret or private key into the shared log. Run either API to collect an example.</p>
      <div className="demo-exposure-apis">{loggingApis.map(service => {
        const result = results[service.id]
        return <article className="demo-exposure-service" key={service.id} data-consumer={service.id}>
          <h4>{service.name}</h4>
          <button className="sign-in" disabled={busy} onClick={() => runLoggingApi(service.type)}>{service.action}</button>
          <dl><dt>Credential</dt><dd>{service.credential}</dd><dt>Outcome</dt>
            <dd className={`demo-exposure-outcome ${result?.status || ''}`}>{result?.status === 'success' ? 'Value written to shared log' : result ? `Failed · ${result.error_code}${result.credential_value_logged ? ' · Value was logged' : ''}` : 'Not run yet'}</dd>
            {result && <><dt>Demo source</dt><dd>{result.issuance_source}</dd><dt>Retrieved at</dt><dd>{result.retrieved_at || 'Unavailable'}</dd>
              <dt>Retrieval time</dt><dd>{result.retrieval_duration_ms ?? '—'} ms</dd><dt>TTL</dt><dd>{result.ttl_seconds ?? 'Unknown'} s</dd>
              <dt>SHA-256 fingerprint</dt><dd className="demo-exposure-fingerprint">{result.fingerprint || 'Unknown'}</dd></>}
          </dl>
        </article>
      })}</div>
    </section>
    <p className="demo-log-note">All backend events are appended to the local <code>.demo/ecomm-demo.jsonl</code> file. Credential values stay on the backend.</p>
  </section>
}

import { useEffect, useRef, useState } from 'react'
import Art from './Art'

type Product = { id: number; name: string; description: string; category: string; artwork: string; price: string }
type Session = { user: { id: number; name: string; email: string } | null; csrf_token: string; login_url: string; provider: string; oauth_configured: boolean }
type Cart = Record<number, number>
type Order = { id: number; items: { name: string; quantity: number; price: string }[]; total: string; created_at: string }
const money = (amount: string | number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(amount))

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${path}/`, { credentials: 'same-origin', ...options })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'We couldn’t complete that request. Please try again.')
  return data
}

function loadCart(): Cart {
  try {
    const saved = JSON.parse(localStorage.getItem('everyday-cart') || '{}')
    return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) => Number.isInteger(Number(id)) && Number(id) > 0 && Number.isInteger(quantity) && Number(quantity) > 0 && Number(quantity) <= 20).map(([id, quantity]) => [id, Number(quantity)]))
  } catch { return {} }
}

function Icon({ kind }: { kind: 'bag' | 'search' | 'arrow' | 'close' | 'leaf' | 'orders' }) {
  const paths = { bag: 'M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2', search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', arrow: 'M4 12h16m-6-6 6 6-6 6', close: 'm6 6 12 12M6 18 18 6', leaf: 'M20 3C8 2 1 9 5 16s16 3 15-13ZM5 20 16 9', orders: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6' }
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [cart, setCart] = useState<Cart>(loadCart)
  const [category, setCategory] = useState('All essentials')
  const [query, setQuery] = useState('')
  const [panel, setPanel] = useState<'cart' | 'orders' | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [orderError, setOrderError] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)

  async function initialize() {
    setLoading(true); setError('')
    try {
      const [catalog, auth] = await Promise.all([api<Product[]>('products'), api<Session>('session')])
      setProducts(catalog); setSession(auth)
      setCart(current => Object.fromEntries(Object.entries(current).filter(([id]) => catalog.some(p => p.id === Number(id)))))
    } catch { setError('The shop is taking a moment. Please try again.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void initialize() }, [])
  useEffect(() => { try { localStorage.setItem('everyday-cart', JSON.stringify(cart)) } catch { /* Browsing still works without storage. */ } }, [cart])
  useEffect(() => {
    if (panel && !dialog.current?.open) dialog.current?.showModal()
    if (!panel) dialog.current?.close()
  }, [panel])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [message])

  const lines = products.filter(p => cart[p.id]).map(product => ({ product, quantity: cart[product.id] }))
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  const total = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0)
  const filtered = products.filter(p => (category === 'All essentials' || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase()))
  const changeQuantity = (id: number, quantity: number) => setCart(current => {
    const next = { ...current }
    if (quantity <= 0) delete next[id]
    else next[id] = Math.min(20, quantity)
    return next
  })

  function signIn() {
    if (!session?.oauth_configured) { setMessage('Sign-in is currently unavailable. Please try again later.'); return }
    const form = document.createElement('form')
    form.method = 'POST'; form.action = session.login_url
    for (const [name, value] of Object.entries({ csrfmiddlewaretoken: session.csrf_token, next: '/' })) {
      const input = document.createElement('input')
      input.type = 'hidden'; input.name = name; input.value = value; form.appendChild(input)
    }
    document.body.appendChild(form); form.submit()
  }

  async function showOrders() {
    if (!session?.user) { signIn(); return }
    setPanel('orders'); setBusy(true); setOrderError('')
    try { setOrders(await api<Order[]>('orders')) }
    catch (e) { setOrderError((e as Error).message) }
    finally { setBusy(false) }
  }

  async function checkout() {
    if (!session?.user) { signIn(); return }
    setBusy(true)
    try {
      const order = await api<Order>('orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': session.csrf_token },
        body: JSON.stringify({ items: lines.map(({ product, quantity }) => ({ product_id: product.id, quantity })) }),
      })
      setCart({}); setPanel(null); setMessage(`Order #${order.id} placed. A little everyday joy is on its way!`)
    } catch (e) { setMessage((e as Error).message) }
    finally { setBusy(false) }
  }

  async function signOut() {
    setBusy(true)
    try {
      await api('logout', { method: 'POST', headers: { 'X-CSRFToken': session!.csrf_token } })
      setSession(await api<Session>('session')); setOrders([]); setMessage('You’re signed out.')
    } catch (e) { setMessage((e as Error).message) }
    finally { setBusy(false) }
  }

  return <>
    <div className="announcement">A little less noise. A little more everyday.</div>
    <header>
      <a className="brand" href="/" aria-label="Everyday home"><span className="brand-mark">✳</span> everyday<span className="brand-dot">.</span></a>
      <nav aria-label="Main navigation"><a className="active" href="#collection">Shop</a><a href="#approach">Our approach</a></nav>
      <div className="header-actions">
        <button className="text-button orders-link" aria-label="My orders" onClick={() => void showOrders()} disabled={loading || busy}><span>My orders</span><Icon kind="orders" /></button>
        {session?.user ? <button className="sign-in" onClick={() => void signOut()} disabled={busy} aria-label="Sign out"><span className="avatar">{session.user.name[0].toUpperCase()}</span> Sign out</button> : <button className="sign-in" onClick={signIn} disabled={loading}>Sign in <span aria-hidden="true">↗</span></button>}
        <button className="cart-button" onClick={() => setPanel('cart')} aria-label={`Open cart, ${count} items`}><Icon kind="bag" /><span>{count}</span></button>
      </div>
    </header>
    <main>
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow"><span className="tiny-line" /> THE EVERYDAY COLLECTION</span>
          <h1>Good things.<br /><em>Simple living.</em></h1>
          <p>Thoughtful essentials for your home, your desk,<br className="desktop-break" /> and wherever the day takes you.</p>
          <a className="primary-button" href="#collection">Find your everyday <Icon kind="arrow" /></a>
          <div className="hero-note"><Icon kind="leaf" /> Fewer things. Better things.</div>
        </div>
        <div className="hero-art"><div className="hero-circle" /><div className="hero-art-mug"><Art kind="mug" /></div><div className="hero-art-notebook"><Art kind="notebook" /></div><span className="hero-label">Made for the little moments.</span><span className="hero-star" aria-hidden="true">✳</span></div>
      </section>
      <section className="collection" id="collection" aria-labelledby="collection-title">
        <div className="collection-heading"><div><span className="eyebrow">LESS, BUT LOVELIER</span><h2 id="collection-title">Your daily essentials</h2></div><span className="product-count">{filtered.length} thoughtful finds</span></div>
        <div className="filters"><div className="tabs" role="group" aria-label="Product categories">{['All essentials', 'Home', 'Desk', 'Carry'].map(value => <button key={value} className={category === value ? 'selected' : ''} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
          <label className="search"><Icon kind="search" /><input aria-label="Search products" placeholder="Find something good…" value={query} onChange={event => setQuery(event.target.value)} /></label>
        </div>
        {loading ? <p className="empty">Gathering the good things…</p> : error ? <div className="empty" role="alert"><p>{error}</p><button className="sign-in" onClick={() => void initialize()}>Try again</button></div> : filtered.length === 0 ? <p className="empty">No finds just yet. Try another search.</p> : <div className="product-grid">{filtered.map(product => <article className="product" key={product.id}>
          <div className={`product-art art-${product.artwork}`}><span className="product-category">{product.category}</span><Art kind={product.artwork} /><button className="add-button" onClick={() => { changeQuantity(product.id, (cart[product.id] || 0) + 1); setMessage(`${product.name} added to your bag.`) }} disabled={cart[product.id] >= 20} aria-label={`Add ${product.name} to cart`}>+</button></div>
          <div className="product-title"><h3>{product.name}</h3><span>{money(product.price)}</span></div><p>{product.description}</p>
        </article>)}</div>}
      </section>
      <section className="approach" id="approach"><span className="approach-symbol" aria-hidden="true">✳</span><div><span className="eyebrow">OUR LITTLE PHILOSOPHY</span><h2>Everyday doesn’t have to be ordinary.</h2><p>Useful by nature. Beautiful by design. Just the things you’ll reach for, again and again.</p></div><span className="approach-end" aria-hidden="true">↗</span></section>
    </main>
    <footer><a className="brand" href="/">everyday.</a><span>Small things. Better days.</span><span>Demo store · no real payments</span></footer>
    {message && !panel && <div className="toast" role="status">{message}<button onClick={() => setMessage('')} aria-label="Dismiss notification"><Icon kind="close" /></button></div>}
    <dialog ref={dialog} onClose={() => setPanel(null)} aria-labelledby="panel-title">
      <div className="panel-header"><div><span className="eyebrow">A LITTLE EVERYDAY JOY</span><h2 id="panel-title">{panel === 'orders' ? 'Your orders' : 'Your bag'} <span>{panel === 'cart' ? `(${count})` : ''}</span></h2></div><button className="icon-button" onClick={() => setPanel(null)} aria-label="Close panel"><Icon kind="close" /></button></div>
      {message && <div className="panel-message" role="status">{message}</div>}
      {panel === 'cart' ? <>
        <div className="panel-body">{lines.length === 0 ? <div className="empty"><Icon kind="bag" /><h3>A little room for something good.</h3><p>Your bag is empty. Explore the collection.</p><button className="primary-button" onClick={() => setPanel(null)}>Keep exploring <Icon kind="arrow" /></button></div> : lines.map(({ product, quantity }) => <div className="cart-line" key={product.id}><div className={`cart-art art-${product.artwork}`}><Art kind={product.artwork} /></div><div className="line-info"><h3>{product.name}</h3><span>{money(product.price)}</span><div className="quantity"><button aria-label={`Decrease ${product.name} quantity`} onClick={() => changeQuantity(product.id, quantity - 1)} disabled={busy}>−</button><span>{quantity}</span><button aria-label={`Increase ${product.name} quantity`} onClick={() => changeQuantity(product.id, quantity + 1)} disabled={busy || quantity >= 20}>+</button><button className="remove" onClick={() => changeQuantity(product.id, 0)} disabled={busy}>Remove</button></div></div><strong>{money(Number(product.price) * quantity)}</strong></div>)}</div>
        {lines.length > 0 && <div className="cart-summary"><div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Delivery</span><span>On us</span></div><p>Demo checkout · no payment required</p><button className="primary-button checkout" onClick={() => void checkout()} disabled={busy || !session}>{busy ? 'Placing your order…' : session?.user ? 'Place demo order' : `Sign in with ${session?.provider || 'your account'} to order`}<Icon kind="arrow" /></button></div>}
      </> : <div className="panel-body">{busy ? <p className="empty">Finding your orders…</p> : orderError ? <div className="empty" role="alert"><p>{orderError}</p><button className="sign-in" onClick={() => void showOrders()}>Try again</button></div> : orders.length === 0 ? <div className="empty"><h3>Your everyday story starts here.</h3><p>Your first order will appear here.</p></div> : orders.map(order => <article className="order" key={order.id}><div><h3>Order #{order.id}</h3><strong>{money(order.total)}</strong></div><time>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>{order.items.map((item, index) => <p key={index}>{item.quantity} × {item.name}</p>)}<span className="order-status">Order placed</span></article>)}</div>}
    </dialog>
  </>
}

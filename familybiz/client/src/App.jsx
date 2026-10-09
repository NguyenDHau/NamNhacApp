import { useEffect, useMemo, useState } from 'react'
import { Activity, Banknote, Boxes, Download, LayoutDashboard, Menu, Plus, RefreshCw, Search, ShoppingBag, Users, Wallet, Wifi, WifiOff, X } from 'lucide-react'
import { all, put, enqueue, exportBackup } from './db'
import { supabase } from './lib/supabaseClient.js'

const money = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(n || 0))
const id = () => crypto.randomUUID()
const today = () => new Date().toISOString().slice(0, 10)

const seed = {
  customers: [
    { id: 'c-demo-1', name: 'Nguyễn Văn An', phone: '0905000001', note: 'Khách quen', createdAt: new Date().toISOString() },
    { id: 'c-demo-2', name: 'Trần Thị Bình', phone: '0905000002', note: '', createdAt: new Date().toISOString() }
  ],
  products: [
    { id: 'p-demo-1', code: 'SP001', name: 'Sản phẩm mẫu A', unit: 'cái', costPrice: 50000, sellingPrice: 75000, createdAt: new Date().toISOString() },
    { id: 'p-demo-2', code: 'SP002', name: 'Sản phẩm mẫu B', unit: 'kg', costPrice: 30000, sellingPrice: 45000, createdAt: new Date().toISOString() }
  ],
  transactions: [
    { id: 't-demo-1', type: 'SALE', customerId: 'c-demo-1', amount: 450000, paidAmount: 200000, date: today(), note: 'Giao dịch mẫu', items: [], createdAt: new Date().toISOString() },
    { id: 't-demo-2', type: 'EXPENSE', customerId: '', amount: 80000, paidAmount: 80000, date: today(), note: 'Chi phí vận chuyển mẫu', items: [], createdAt: new Date().toISOString() }
  ]
}


const isUuid = value =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '')

function toCloudRow(entity, r, userId) {
  const common = {
    id: r.id,
    user_id: userId,
    created_at: r.createdAt || new Date().toISOString()
  }

  if (entity === 'customer') {
    return {
      ...common,
      name: r.name,
      phone: r.phone || '',
      notes: r.note || '',
      address: r.address || ''
    }
  }

  if (entity === 'product') {
    return {
      ...common,
      name: r.name,
      sku: r.code || '',
      unit: r.unit || '',
      cost_price: Number(r.costPrice || 0),
      selling_price: Number(r.sellingPrice || 0),
      price: Number(r.sellingPrice || 0),
      stock: 0,
      notes: r.note || ''
    }
  }

  return {
    ...common,
    type: r.type,
    description: r.note || '',
    amount: Number(r.amount || 0),
    customer_id: isUuid(r.customerId) ? r.customerId : null,
    product_id: null,
    payment_status:
      Number(r.paidAmount || 0) >= Number(r.amount || 0)
        ? 'PAID'
        : 'UNPAID',
    paid_amount: Number(r.paidAmount || 0),
    date: r.date || new Date().toISOString().slice(0, 10),
    notes: r.note || ''
  }
}

function fromCloudRow(entity, r) {
  if (entity === 'customer') {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone || '',
      address: r.address || '',
      note: r.notes || '',
      createdAt: r.created_at
    }
  }

  if (entity === 'product') {
    return {
      id: r.id,
      code: r.sku || '',
      name: r.name,
      unit: r.unit || '',
      costPrice: Number(r.cost_price || 0),
      sellingPrice: Number(r.selling_price ?? r.price ?? 0),
      createdAt: r.created_at
    }
  }

  return {
    id: r.id,
    type: r.type,
    customerId: r.customer_id || '',
    amount: Number(r.amount || 0),
    paidAmount: Number(r.paid_amount || 0),
    date: r.date,
    note: r.notes || r.description || '',
    items: [],
    createdAt: r.created_at
  }
}

const nav = [
  ['dashboard', 'Tổng quan', LayoutDashboard],
  ['transactions', 'Giao dịch', Activity],
  ['customers', 'Khách hàng & nợ', Users],
  ['products', 'Bảng giá', Boxes]
]

function FamilyBizApp() {
  const [page, setPage] = useState('dashboard')
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [online, setOnline] = useState(navigator.onLine)
  const [modal, setModal] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [ready, setReady] = useState(false)

  async function refresh() {
    const [c, p, t] = await Promise.all([all('customers'), all('products'), all('transactions')])
    setCustomers(c); setProducts(p); setTransactions(t)
  }


async function loadCloudData() {
  const tables = [
    ['customers', 'customer'],
    ['products', 'product'],
    ['transactions', 'transaction']
  ]

  for (const [table, entity] of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')

    if (error) throw error

    const store = table

    for (const row of data || []) {
      await put(store, fromCloudRow(entity, row))
    }
  }

  await refresh()
}

  useEffect(() => {
    const closeModal = () => setModal('')
    window.addEventListener('close-modal', closeModal)
    return () => window.removeEventListener('close-modal', closeModal)
  }, [])

  useEffect(() => {
    const start = async () => {
      const [c, p, t] = await Promise.all([all('customers'), all('products'), all('transactions')])
      if (!c.length && !p.length && !t.length) {
        for (const item of seed.customers) await put('customers', item)
        for (const item of seed.products) await put('products', item)
        for (const item of seed.transactions) await put('transactions', item)
      }
      try {
  await loadCloudData()
} catch (error) {
  console.error('Không tải được dữ liệu Supabase:', error)
}

await refresh()
setReady(true)
    }
    start()
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const stats = useMemo(() => {
    const sales = transactions.filter(t => t.type === 'SALE').reduce((s,t) => s + Number(t.amount || 0), 0)
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s,t) => s + Number(t.amount || 0), 0)
    const received = transactions.reduce((s,t) => s + (t.type === 'SALE' ? Number(t.paidAmount || 0) : t.type === 'PAYMENT_RECEIVED' ? Number(t.amount || 0) : 0), 0)
    const saleDebt = transactions.filter(t => t.type === 'SALE').reduce((s,t) => s + Math.max(0, Number(t.amount || 0) - Number(t.paidAmount || 0)), 0)
    const collectedDebt = transactions.filter(t => t.type === 'PAYMENT_RECEIVED').reduce((s,t) => s + Number(t.amount || 0), 0)
    const debt = Math.max(0, saleDebt - collectedDebt)
    return { sales, expenses, received, debt, profit: sales - expenses }
  }, [transactions])

  

async function saveRecord(store, entity, record) {
  try {
    // 1. Lưu dữ liệu trên thiết bị
    await put(store, record)
    await enqueue(entity, record)
    await refresh()
    setModal('')

    // 2. Kiểm tra kết nối mạng
    if (!navigator.onLine) {
      setToast('Đã lưu trên thiết bị. Chưa đồng bộ vì đang offline.')
      return
    }

    // 3. Kiểm tra tài khoản Supabase
    const { data, error: authError } =
      await supabase.auth.getUser()

    if (authError) throw authError

    const user = data?.user

    if (!user) {
      setToast(
        'Đã lưu trên thiết bị nhưng chưa đồng bộ: Bạn chưa đăng nhập Supabase.'
      )
      return
    }

    // 4. Xác định bảng cần lưu
    const table = {
      customer: 'customers',
      product: 'products',
      transaction: 'transactions'
    }[entity]

    if (!table) {
      throw new Error('Loại dữ liệu không hợp lệ.')
    }

    // 5. Ghi dữ liệu lên Supabase
    const row = toCloudRow(entity, record, user.id)

    const { error } = await supabase
      .from(table)
      .upsert(row, { onConflict: 'id' })

    if (error) throw error

    setToast('Đã lưu và đồng bộ lên Supabase thành công.')
  } catch (error) {
    console.error('FamilyBiz save/sync error:', error)

    setToast(
      `Có lỗi khi lưu hoặc đồng bộ: ${error?.message || 'Lỗi không xác định'}`
    )
  }

  setTimeout(() => setToast(''), 6000)
}

  async function backup() {
    const data = await exportBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `familybiz-backup-${today()}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!ready) return <div className="loading">Đang mở FamilyBiz…</div>

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Wallet size={21}/></div><div><strong>FamilyBiz</strong><small>Quản lý gia đình</small></div></div>
      <div className="family-label">KHÔNG GIAN LÀM VIỆC</div>
      <div className="family-switch"><span className="family-dot"/> Gia đình tôi <span className="chevron">⌄</span></div>
      <nav>{nav.map(([key, label, Icon]) => <button key={key} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => { setPage(key); setSearch('') }}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="offline-note">{online ? <Wifi size={16}/> : <WifiOff size={16}/>}<span>{online ? 'Đang có kết nối mạng' : 'Đang ở chế độ offline'}</span></div><button className="backup-button" onClick={backup}><Download size={16}/> Sao lưu dữ liệu</button><small>FamilyBiz MVP · Bản thử nghiệm</small></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><div className="breadcrumb">Gia đình tôi <span>/</span> {nav.find(n => n[0] === page)?.[1] || 'Tổng quan'}</div><h1>{nav.find(n => n[0] === page)?.[1] || 'Tổng quan'}</h1></div><div className="top-actions"><span className={`connection ${online ? 'online' : 'offline'}`}>{online ? <Wifi size={14}/> : <WifiOff size={14}/>} {online ? 'Online' : 'Offline'}</span><button className="avatar" title="Tài khoản demo">GD</button></div></header>

      {page === 'dashboard' && <Dashboard stats={stats} transactions={transactions} customers={customers} products={products} setPage={setPage} setModal={setModal}/>}
      {page === 'customers' && <Customers customers={customers} transactions={transactions} search={search} setSearch={setSearch} setModal={setModal}/>}
      {page === 'products' && <Products products={products} search={search} setSearch={setSearch} setModal={setModal}/>}
      {page === 'transactions' && <Transactions transactions={transactions} customers={customers} search={search} setSearch={setSearch} setModal={setModal}/>}

      <footer className="app-footer"><span>© 2026 FamilyBiz</span><span><span className="sync-dot"/> Lưu trữ cục bộ trên thiết bị</span></footer>
    </main>

    {modal === 'customer' && <Modal title="Thêm khách hàng" close={() => setModal('')}><CustomerForm onSave={r => saveRecord('customers','customer',r)}/></Modal>}
    {modal === 'product' && <Modal title="Thêm sản phẩm / bảng giá" close={() => setModal('')}><ProductForm onSave={r => saveRecord('products','product',r)}/></Modal>}
    {modal === 'transaction' && <Modal title="Thêm giao dịch" close={() => setModal('')}><TransactionForm customers={customers} onSave={r => saveRecord('transactions','transaction',r)}/></Modal>}
    {toast && <div className="toast">{toast}</div>}
  </div>
}

function Dashboard({ stats, transactions, customers, products, setPage, setModal }) {
  const recent = [...transactions].sort((a,b) => (b.date || '').localeCompare(a.date || '')).slice(0,5)
  return <div className="page-content">
    <div className="welcome-row"><div><h2>Xin chào! 👋</h2><p>Đây là tình hình kinh doanh của gia đình bạn.</p></div><button className="primary-button" onClick={() => setModal('transaction')}><Plus size={17}/> Thêm giao dịch</button></div>
    <div className="demo-banner"><span className="demo-icon">i</span><div><strong>Đang sử dụng dữ liệu mẫu</strong><p>Bạn có thể thêm dữ liệu thật để thử nghiệm. Dữ liệu hiện chỉ lưu trên trình duyệt này, chưa chia sẻ giữa các điện thoại.</p></div></div>
    <div className="stat-grid">
      <Stat label="Doanh thu ghi nhận" value={money(stats.sales)} icon={Banknote} tone="teal" foot="Tổng giá trị bán hàng"/>
      <Stat label="Công nợ còn lại" value={money(stats.debt)} icon={Users} tone="orange" foot="Từ giao dịch bán chịu"/>
      <Stat label="Chi phí" value={money(stats.expenses)} icon={Wallet} tone="purple" foot="Chi phí đã ghi nhận"/>
      <Stat label="Chênh lệch thu - chi*" value={money(stats.profit)} icon={Activity} tone="blue" foot="Doanh thu trừ chi phí"/>
    </div>
    <div className="quick-grid">
      <button className="quick-card" onClick={() => setModal('customer')}><span className="quick-icon teal-bg"><Users size={20}/></span><span><strong>Thêm khách hàng</strong><small>Lưu thông tin khách và theo dõi nợ</small></span><Plus size={17}/></button>
      <button className="quick-card" onClick={() => setModal('product')}><span className="quick-icon blue-bg"><ShoppingBag size={20}/></span><span><strong>Thêm sản phẩm</strong><small>Cập nhật bảng giá bán</small></span><Plus size={17}/></button>
    </div>
    <section className="panel">
      <div className="panel-heading"><div><h3>Giao dịch gần đây</h3><p>Các giao dịch mới nhất trên thiết bị này</p></div><button className="text-button" onClick={() => setPage('transactions')}>Xem tất cả →</button></div>
      <TransactionTable transactions={recent} customers={customers}/>
      {!recent.length && <Empty text="Chưa có giao dịch nào."/>}
    </section>
    <p className="footnote">* Chưa phải lợi nhuận kế toán: chưa tính đầy đủ giá vốn, hàng tồn kho hoặc các điều chỉnh.</p>
  </div>
}

function Stat({ label, value, icon: Icon, tone, foot }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>
}

function Customers({ customers, transactions, search, setSearch, setModal }) {
  const rows = customers.filter(c => `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase())).map(c => ({
    ...c, debt: Math.max(0, transactions.filter(t => t.type === 'SALE' && t.customerId === c.id).reduce((s,t) => s + Math.max(0, Number(t.amount)-Number(t.paidAmount)),0) - transactions.filter(t => t.type === 'PAYMENT_RECEIVED' && t.customerId === c.id).reduce((s,t) => s + Number(t.amount || 0),0))
  }))
  return <div className="page-content"><div className="list-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên hoặc số điện thoại…"/></div><button className="primary-button" onClick={() => setModal('customer')}><Plus size={17}/> Thêm khách hàng</button></div>
    <div className="panel"><div className="panel-heading"><div><h3>Danh sách khách hàng</h3><p>{customers.length} khách hàng trong thiết bị này</p></div></div>
    <div className="table-wrap"><table><thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Ghi chú</th><th className="right">Còn nợ</th></tr></thead><tbody>{rows.map(c => <tr key={c.id}><td><div className="person-cell"><span className="person-avatar">{c.name.slice(0,1).toUpperCase()}</span><strong>{c.name}</strong></div></td><td>{c.phone || '—'}</td><td>{c.note || '—'}</td><td className={`right ${c.debt ? 'debt-text' : ''}`}>{money(c.debt)}</td></tr>)}</tbody></table>{!rows.length && <Empty text="Không tìm thấy khách hàng."/ >}</div></div></div>
}

function Products({ products, search, setSearch, setModal }) {
  const rows = products.filter(p => `${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="page-content"><div className="list-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên hoặc mã sản phẩm…"/></div><button className="primary-button" onClick={() => setModal('product')}><Plus size={17}/> Thêm sản phẩm</button></div>
    <div className="panel"><div className="panel-heading"><div><h3>Bảng giá</h3><p>{products.length} sản phẩm / dịch vụ</p></div></div><div className="table-wrap"><table><thead><tr><th>Mã</th><th>Tên sản phẩm</th><th>Đơn vị</th><th className="right">Giá vốn</th><th className="right">Giá bán</th></tr></thead><tbody>{rows.map(p => <tr key={p.id}><td><span className="code-pill">{p.code || '—'}</span></td><td><strong>{p.name}</strong></td><td>{p.unit || '—'}</td><td className="right">{money(p.costPrice)}</td><td className="right price-text">{money(p.sellingPrice)}</td></tr>)}</tbody></table>{!rows.length && <Empty text="Chưa có sản phẩm phù hợp."/ >}</div></div></div>
}

function Transactions({ transactions, customers, search, setSearch, setModal }) {
  const rows = [...transactions].filter(t => {
    const customer = customers.find(c => c.id === t.customerId)?.name || ''
    return `${customer} ${t.note || ''} ${t.type}`.toLowerCase().includes(search.toLowerCase())
  }).sort((a,b) => (b.date || '').localeCompare(a.date || ''))
  return <div className="page-content"><div className="list-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giao dịch…"/></div><button className="primary-button" onClick={() => setModal('transaction')}><Plus size={17}/> Thêm giao dịch</button></div>
    <div className="panel"><div className="panel-heading"><div><h3>Lịch sử giao dịch</h3><p>{transactions.length} giao dịch</p></div></div><TransactionTable transactions={rows} customers={customers}/>{!rows.length && <Empty text="Chưa có giao dịch."/ >}</div></div>
}

function TransactionTable({ transactions, customers }) {
  const typeLabel = { SALE: ['Bán hàng','sale'], EXPENSE: ['Chi phí','expense'], PAYMENT_RECEIVED: ['Thu nợ','payment'] }
  return <div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Loại</th><th>Khách hàng / nội dung</th><th className="right">Giá trị</th><th className="right">Còn nợ</th></tr></thead><tbody>{transactions.map(t => {
    const [label, cls] = typeLabel[t.type] || ['Điều chỉnh','expense']
    const customer = customers.find(c => c.id === t.customerId)?.name
    const debt = t.type === 'SALE' ? Math.max(0, Number(t.amount)-Number(t.paidAmount)) : 0
    return <tr key={t.id}><td>{t.date || '—'}</td><td><span className={`type-pill ${cls}`}>{label}</span></td><td><strong>{customer || t.note || 'Giao dịch'}</strong>{customer && t.note && <small className="cell-sub">{t.note}</small>}</td><td className="right">{money(t.amount)}</td><td className={`right ${debt ? 'debt-text' : ''}`}>{money(debt)}</td></tr>
  })}</tbody></table></div>
}

function Empty({ text }) { return <div className="empty-state"><div className="empty-icon"><Search size={22}/></div><strong>{text}</strong></div> }

function Modal({ title, close, children }) {
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close() }}><div className="modal"><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={close}><X size={20}/></button></div>{children}</div></div>
}

function CustomerForm({ onSave }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [note, setNote] = useState('')
  return <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; onSave({ id:id(), name:name.trim(), phone:phone.trim(), note:note.trim(), createdAt:new Date().toISOString() }) }}>
    <label>Tên khách hàng <b>*</b><input required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên khách hàng"/></label>
    <label>Số điện thoại<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ví dụ: 0905…"/></label>
    <label>Ghi chú<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Thông tin thêm (không bắt buộc)"/></label>
    <div className="form-actions"><button type="button" className="secondary-button" onClick={() => window.dispatchEvent(new Event('close-modal'))}>Hủy</button><button className="primary-button" type="submit">Lưu khách hàng</button></div>
  </form>
}

function ProductForm({ onSave }) {
  const [code, setCode] = useState(''); const [name, setName] = useState(''); const [unit, setUnit] = useState('cái'); const [costPrice, setCost] = useState('0'); const [sellingPrice, setSelling] = useState('0')
  return <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; onSave({ id:id(), code:code.trim(), name:name.trim(), unit:unit.trim(), costPrice:Number(costPrice), sellingPrice:Number(sellingPrice), createdAt:new Date().toISOString() }) }}>
    <div className="form-grid"><label>Mã sản phẩm<input value={code} onChange={e => setCode(e.target.value)} placeholder="SP001"/></label><label>Đơn vị<input value={unit} onChange={e => setUnit(e.target.value)} placeholder="cái, kg…"/></label></div>
    <label>Tên sản phẩm / dịch vụ <b>*</b><input required value={name} onChange={e => setName(e.target.value)} placeholder="Tên sản phẩm"/></label>
    <div className="form-grid"><label>Giá vốn (VNĐ)<input type="number" min="0" required value={costPrice} onChange={e => setCost(e.target.value)}/></label><label>Giá bán (VNĐ)<input type="number" min="0" required value={sellingPrice} onChange={e => setSelling(e.target.value)}/></label></div>
    <div className="form-actions"><button type="button" className="secondary-button" onClick={() => window.dispatchEvent(new Event('close-modal'))}>Hủy</button><button className="primary-button" type="submit">Lưu sản phẩm</button></div>
  </form>
}

function TransactionForm({ customers, onSave }) {
  const [type, setType] = useState('SALE'); const [customerId, setCustomer] = useState(''); const [amount, setAmount] = useState(''); const [paidAmount, setPaid] = useState(''); const [date, setDate] = useState(today()); const [note, setNote] = useState('')
  return <form onSubmit={e => { e.preventDefault(); const amt = Number(amount); const paid = type === 'SALE' ? Math.min(amt, Math.max(0, Number(paidAmount || 0))) : amt; if (!amt || amt < 0) return; onSave({ id:id(), type, customerId: (type === 'SALE' || type === 'PAYMENT_RECEIVED') ? customerId : '', amount:amt, paidAmount:paid, date, note:note.trim(), items:[], createdAt:new Date().toISOString() }) }}>
    <label>Loại giao dịch<select value={type} onChange={e => setType(e.target.value)}><option value="SALE">Bán hàng</option><option value="PAYMENT_RECEIVED">Thu nợ</option><option value="EXPENSE">Chi phí</option></select></label>
    {(type === 'SALE' || type === 'PAYMENT_RECEIVED') && <label>Khách hàng<select required value={customerId} onChange={e => setCustomer(e.target.value)}><option value="">Chọn khách hàng</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
    <div className="form-grid"><label>Số tiền (VNĐ) <b>*</b><input type="number" min="1" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"/></label><label>Ngày giao dịch<input type="date" required value={date} onChange={e => setDate(e.target.value)}/></label></div>
    {type === 'SALE' && <label>Khách đã trả (VNĐ)<input type="number" min="0" max={amount || undefined} value={paidAmount} onChange={e => setPaid(e.target.value)} placeholder="Mặc định 0"/></label>}
    <label>Ghi chú<input value={note} onChange={e => setNote(e.target.value)} placeholder="Nội dung giao dịch"/></label>
    <div className="form-actions"><button type="button" className="secondary-button" onClick={() => window.dispatchEvent(new Event('close-modal'))}>Hủy</button><button className="primary-button" type="submit">Lưu giao dịch</button></div>
  </form>
}


function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return

      if (error) {
        console.error('Không kiểm tra được phiên đăng nhập:', error)
      }

      setSession(data?.session ?? null)
      setCheckingSession(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (checkingSession) {
    return <div className="loading">Đang kiểm tra đăng nhập…</div>
  }

  if (!session) {
    return <AuthScreen />
  }

  return <FamilyBizApp />
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setErrorMessage('')

    const normalizedEmail = email.trim()

    if (!normalizedEmail || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu.')
      return
    }

    setBusy(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        })

        if (error) throw error

        // App sẽ tự mở giao diện quản lý khi có session.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password
        })

        if (error) throw error

        if (data.session) {
          setMessage('Đăng ký thành công!')
        } else {
          setMessage(
            'Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.'
          )
          setMode('login')
        }
      }
    } catch (error) {
      console.error('Lỗi xác thực Supabase:', error)
      setErrorMessage(
        error?.message || 'Không thể xác thực. Vui lòng thử lại.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 20,
      background: '#f4f7fb',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: 28,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        boxSizing: 'border-box'
      }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>
          FamilyBiz
        </h1>

        <p style={{ color: '#64748b', marginTop: 0 }}>
          {mode === 'login'
            ? 'Đăng nhập để quản lý và đồng bộ dữ liệu.'
            : 'Tạo tài khoản FamilyBiz của bạn.'}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 14 }}>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                marginTop: 6,
                border: '1px solid #cbd5e1',
                borderRadius: 8
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 18 }}>
            Mật khẩu
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                marginTop: 6,
                border: '1px solid #cbd5e1',
                borderRadius: 8
              }}
            />
          </label>

          {errorMessage && (
            <p role="alert" style={{ color: '#dc2626', fontSize: 14 }}>
              {errorMessage}
            </p>
          )}

          {message && (
            <p role="status" style={{ color: '#047857', fontSize: 14 }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              padding: 13,
              border: 0,
              borderRadius: 8,
              background: '#0f766e',
              color: '#fff',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer'
            }}
          >
            {busy
              ? 'Đang xử lý…'
              : mode === 'login'
                ? 'Đăng nhập'
                : 'Tạo tài khoản'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginBottom: 0, fontSize: 14 }}>
          {mode === 'login'
            ? 'Chưa có tài khoản? '
            : 'Đã có tài khoản? '}

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setMessage('')
              setErrorMessage('')
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: '#0f766e',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  )
}
export default App
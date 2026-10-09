
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Boxes,
  Download,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
  Wifi,
  WifiOff
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { isUuid, today } from '../utils/format.js'
import Dashboard from './dashboard/Dashboard.jsx'
import Customers from './customers/Customers.jsx'
import Products from './products/Products.jsx'
import Transactions from './transactions/Transactions.jsx'
import {
  all,
  put,
  remove,
  enqueue,
  getPendingSync,
  removeSyncItem,
  exportBackup
} from '../db.js'

const nav = [
  ['dashboard', 'Tổng quan', LayoutDashboard],
  ['transactions', 'Giao dịch', Activity],
  ['customers', 'Khách hàng & nợ', Users],
  ['products', 'Bảng giá', Boxes]
]

const seed = { customers: [], products: [], transactions: [] }

function toCloudRow(entity, record, userId) {
  const common = {
    id: record.id,
    user_id: userId,
    created_at: record.createdAt || new Date().toISOString()
  }

  if (entity === 'customer') {
    return {
      ...common,
      name: record.name,
      phone: record.phone || '',
      address: record.address || '',
      notes: record.note || ''
    }
  }

  if (entity === 'product') {
    return {
      ...common,
      name: record.name,
      sku: record.code || '',
      unit: record.unit || '',
      cost_price: Number(record.costPrice || 0),
      selling_price: Number(record.sellingPrice || 0),
      price: Number(record.sellingPrice || 0),
      stock: 0,
      notes: record.note || ''
    }
  }

  return {
    ...common,
    type: record.type,
    description: record.note || '',
    amount: Number(record.amount || 0),
    customer_id: isUuid(record.customerId) ? record.customerId : null,
    product_id: null,
    payment_status:
      Number(record.paidAmount || 0) <= 0
        ? 'unpaid'
        : Number(record.paidAmount || 0) >= Number(record.amount || 0)
          ? 'paid'
          : 'partial',
    paid_amount: Number(record.paidAmount || 0),
    date: record.date || today(),
    notes: record.note || '',
    items: Array.isArray(record.items) ? record.items : []
  }
}

function fromCloudRow(entity, record) {
  if (entity === 'customer') {
    return {
      id: record.id,
      name: record.name,
      phone: record.phone || '',
      address: record.address || '',
      note: record.notes || '',
      createdAt: record.created_at
    }
  }

  if (entity === 'product') {
    return {
      id: record.id,
      code: record.sku || '',
      name: record.name,
      unit: record.unit || '',
      costPrice: Number(record.cost_price || 0),
      sellingPrice: Number(record.selling_price ?? record.price ?? 0),
      note: record.notes || '',
      createdAt: record.created_at
    }
  }

  return {
    id: record.id,
    type: record.type,
    customerId: record.customer_id || '',
    amount: Number(record.amount || 0),
    paidAmount: Number(record.paid_amount || 0),
    date: record.date,
    note: record.notes || record.description || '',
    items: Array.isArray(record.items) ? record.items : [],
    createdAt: record.created_at
  }
}

export default function FamilyBizApp() {
  const [page, setPage] = useState('dashboard')
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [online, setOnline] = useState(navigator.onLine)
  const [toast, setToast] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const [customerRows, productRows, transactionRows] = await Promise.all([
      all('customers'),
      all('products'),
      all('transactions')
    ])

    setCustomers(customerRows)
    setProducts(productRows)
    setTransactions(transactionRows)
  }, [])

  const loadCloudData = useCallback(async () => {
    const tables = [
      ['customers', 'customer'],
      ['products', 'product'],
      ['transactions', 'transaction']
    ]

    for (const [table, entity] of tables) {
      const { data, error } = await supabase.from(table).select('*')
      if (error) throw error

      for (const row of data || []) {
        await put(table, fromCloudRow(entity, row))
      }
    }

    await refresh()
  }, [refresh])

  useEffect(() => {
    let active = true

    async function start() {
      try {
        const [customerRows, productRows, transactionRows] = await Promise.all([
          all('customers'),
          all('products'),
          all('transactions')
        ])

        if (!customerRows.length && !productRows.length && !transactionRows.length) {
          for (const row of seed.customers) await put('customers', row)
          for (const row of seed.products) await put('products', row)
          for (const row of seed.transactions) await put('transactions', row)
        }

        try {
          await loadCloudData()
        } catch (error) {
          console.error('Không tải được dữ liệu Supabase:', error)
          if (active) {
            setToast('Không tải được dữ liệu trực tuyến. Đang hiển thị dữ liệu trên thiết bị.')
          }
        }

        await refresh()
      } catch (error) {
        console.error('Không khởi tạo được FamilyBiz:', error)
        if (active) setToast('Không thể mở dữ liệu cục bộ. Hãy tải lại trang.')
      } finally {
        if (active) setReady(true)
      }
    }

    start()

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      active = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [loadCloudData, refresh])

  const stats = useMemo(() => {
    const sales = transactions
      .filter(t => t.type === 'SALE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const received = transactions.reduce((sum, t) => {
      if (t.type === 'SALE') return sum + Number(t.paidAmount || 0)
      if (t.type === 'PAYMENT_RECEIVED') return sum + Number(t.amount || 0)
      return sum
    }, 0)

    const saleDebt = transactions
      .filter(t => t.type === 'SALE')
      .reduce((sum, t) => sum + Math.max(
        0,
        Number(t.amount || 0) - Number(t.paidAmount || 0)
      ), 0)

    const collectedDebt = transactions
      .filter(t => t.type === 'PAYMENT_RECEIVED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    return {
      sales,
      expenses,
      received,
      debt: Math.max(0, saleDebt - collectedDebt),
      profit: sales - expenses
    }
  }, [transactions])

  async function deleteRecord(store, entity, id) {
  setBusy(true)
  setToast('')

  try {
    const existing = (await all(store)).find(item => item.id === id)

    if (!existing) {
      setToast('Không tìm thấy dữ liệu cần xóa.')
      return
    }

    await remove(store, id)
    await enqueue(entity, { id }, 'DELETE')
    await refresh()

    if (!navigator.onLine) {
      setToast('Đã xóa trên thiết bị. Sẽ đồng bộ khi có mạng.')
      return
    }

    try {
      await syncPendingChanges()
      setToast('Đã xóa và đồng bộ thành công.')
    } catch (error) {
      console.error('Lỗi đồng bộ thao tác xóa:', error)
      setToast(
        'Đã xóa trên thiết bị nhưng chưa đồng bộ lên Supabase: ' +
        (error?.message || 'Lỗi không xác định')
      )
    }
  } catch (error) {
    console.error('Lỗi xóa dữ liệu:', error)
    setToast(`Không thể xóa: ${error?.message || 'Lỗi không xác định'}`)
  } finally {
    setBusy(false)
    window.setTimeout(() => setToast(''), 6000)
  }
}

  async function saveRecord(store, entity, record) {
  setBusy(true)
  setToast('')

  try {
    await put(store, record)

    const queueId = await enqueue(entity, record, 'UPSERT')
    await refresh()

    if (!navigator.onLine) {
      setToast('Đã lưu trên thiết bị. Sẽ đồng bộ khi có mạng.')
      return
    }

    try {
      await syncPendingChanges()
      setToast('Đã lưu và đồng bộ thành công.')
    } catch (error) {
      console.error('Lỗi đồng bộ:', error)
      setToast(
        'Dữ liệu đã lưu trên thiết bị nhưng chưa đồng bộ: ' +
        (error?.message || 'Lỗi không xác định')
      )
    }
  } catch (error) {
    console.error('Lỗi lưu dữ liệu:', error)
    setToast(`Không thể lưu dữ liệu: ${error?.message || 'Lỗi không xác định'}`)
  } finally {
    setBusy(false)
    window.setTimeout(() => setToast(''), 6000)
  }
}

  async function syncPendingChanges() {
  if (!navigator.onLine) return

  const { data, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!data?.user) throw new Error('Bạn chưa đăng nhập Supabase.')

  const pending = await getPendingSync()

  const tables = {
    customer: 'customers',
    product: 'products',
    transaction: 'transactions'
  }

  for (const task of pending) {
    const table = tables[task.entity]
    if (!table) continue

    let result

    if (task.operation === 'DELETE') {
  const recordId = task.record.id

  // ID demo/cục bộ không phải UUID của Supabase.
  // Không gửi ID sai định dạng lên database.
  if (!isUuid(recordId)) {
    await removeSyncItem(task.id)
    continue
  }

  result = await supabase
    .from(table)
    .delete()
    .eq('id', recordId)
} else {
      const row = toCloudRow(task.entity, task.record, data.user.id)

      result = await supabase
        .from(table)
        .upsert(row, { onConflict: 'id' })
    }

    if (result.error) {
      throw result.error
    }

    await removeSyncItem(task.id)
  }
}

  async function backup() {
    try {
      const data = await exportBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `familybiz-backup-${today()}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Lỗi sao lưu:', error)
      setToast('Không thể tạo bản sao lưu.')
    }
  }

  async function logout() {
    const confirmed = window.confirm('Bạn muốn đăng xuất FamilyBiz?')
    if (!confirmed) return

    const { error } = await supabase.auth.signOut()
    if (error) setToast(`Không thể đăng xuất: ${error.message}`)
  }

  if (!ready) return <div className="loading">Đang mở FamilyBiz…</div>

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Wallet size={21} /></div>
          <div><strong>FamilyBiz</strong><small>Quản lý gia đình</small></div>
        </div>

        <div className="family-label">KHÔNG GIAN LÀM VIỆC</div>
        <div className="family-switch">
          <span className="family-dot" /> Gia đình tôi <span className="chevron">⌄</span>
        </div>

        <nav>
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              className={`nav-item ${page === key ? 'active' : ''}`}
              onClick={() => setPage(key)}
            >
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="offline-note">
            {online ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{online ? 'Đang có kết nối mạng' : 'Đang ở chế độ offline'}</span>
          </div>
          <button className="backup-button" onClick={backup}>
            <Download size={16} /> Sao lưu dữ liệu
          </button>
          <button className="backup-button" onClick={logout}>
            <LogOut size={16} /> Đăng xuất
          </button>
          <small>FamilyBiz MVP · Bản thử nghiệm</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              Gia đình tôi <span>/</span> {nav.find(item => item[0] === page)?.[1]}
            </div>
            <h1>{nav.find(item => item[0] === page)?.[1]}</h1>
          </div>
          <div className="top-actions">
            <span className={`connection ${online ? 'online' : 'offline'}`}>
              {online ? <Wifi size={14} /> : <WifiOff size={14} />}
              {online ? 'Online' : 'Offline'}
            </span>
            <button className="avatar" title="Tài khoản">FB</button>
          </div>
        </header>

        {page === 'dashboard' && (
          <Dashboard
            stats={stats}
            transactions={transactions}
            customers={customers}
            products={products}
            setPage={setPage}
            setModal={type => {
              if (type === 'customer') setPage('customers')
              else if (type === 'product') setPage('products')
              else setPage('transactions')
            }}
          />
        )}

        {page === 'customers' && (
          <Customers
            customers={customers}
            transactions={transactions}
            onSave={record => saveRecord('customers', 'customer', record)}
            onSavePayment={record => saveRecord('transactions', 'transaction', record)}
          />
        )}

        {page === 'products' && (
  <Products
    products={products}
    onSave={record => saveRecord('products', 'product', record)}
    onDelete={id => deleteRecord('products', 'product', id)}
  />
)}

        {page === 'transactions' && (
        <Transactions
  transactions={transactions}
  customers={customers}
  products={products}
  onSave={record =>
    saveRecord('transactions', 'transaction', record)
  }
  onDelete={transaction =>
    deleteRecord('transactions', 'transaction', transaction.id)
  }
/>
        )}

        <footer className="app-footer">
          <span>© 2026 FamilyBiz</span>
          <span><span className="sync-dot" /> Lưu trữ cục bộ trên thiết bị</span>
        </footer>
      </main>

      {busy && <div className="toast">Đang lưu dữ liệu…</div>}
      {toast && !busy && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
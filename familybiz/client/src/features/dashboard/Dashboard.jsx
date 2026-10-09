
import {
  Activity,
  Banknote,
  Plus,
  ShoppingBag,
  Users,
  Wallet
} from 'lucide-react'
import { money } from '../../utils/format.js'
import Empty from '../../components/common/Empty.jsx'

function Stat({ label, value, icon: Icon, tone, foot }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </div>
  )
}

function TransactionTable({ transactions, customers }) {
  const labels = {
    SALE: ['Bán hàng', 'sale'],
    EXPENSE: ['Chi phí', 'expense'],
    PAYMENT_RECEIVED: ['Thu nợ', 'payment']
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ngày</th><th>Loại</th><th>Khách hàng / nội dung</th>
            <th className="right">Giá trị</th><th className="right">Còn nợ</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => {
            const [label, cls] = labels[t.type] || ['Điều chỉnh', 'expense']
            const customer = customers.find(c => c.id === t.customerId)?.name
            const debt = t.type === 'SALE'
              ? Math.max(0, Number(t.amount || 0) - Number(t.paidAmount || 0))
              : 0

            return (
              <tr key={t.id}>
                <td>{t.date || '—'}</td>
                <td><span className={`type-pill ${cls}`}>{label}</span></td>
                <td>
                  <strong>{customer || t.note || 'Giao dịch'}</strong>
                  {customer && t.note && <small className="cell-sub">{t.note}</small>}
                </td>
                <td className="right">{money(t.amount)}</td>
                <td className={`right ${debt ? 'debt-text' : ''}`}>{money(debt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard({
  stats,
  transactions,
  customers,
  setPage,
  setModal
}) {
  const recent = [...transactions]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5)

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <h2>Xin chào! 👋</h2>
          <p>Đây là tình hình kinh doanh của gia đình bạn.</p>
        </div>
        <button className="primary-button" onClick={() => setModal('transaction')}>
          <Plus size={17} /> Thêm giao dịch
        </button>
      </div>

      <div className="demo-banner">
        <span className="demo-icon">i</span>
        <div>
          <strong>Dữ liệu được quản lý theo tài khoản</strong>
          <p>
            Khi có kết nối mạng, FamilyBiz tải và đồng bộ dữ liệu với Supabase.
            Hãy sao lưu định kỳ để phòng trường hợp mất dữ liệu trên thiết bị.
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Doanh thu ghi nhận" value={money(stats.sales)}
          icon={Banknote} tone="teal" foot="Tổng giá trị bán hàng" />
        <Stat label="Công nợ còn lại" value={money(stats.debt)}
          icon={Users} tone="orange" foot="Từ giao dịch bán chịu" />
        <Stat label="Chi phí" value={money(stats.expenses)}
          icon={Wallet} tone="purple" foot="Chi phí đã ghi nhận" />
        <Stat label="Chênh lệch thu - chi*" value={money(stats.profit)}
          icon={Activity} tone="blue" foot="Doanh thu trừ chi phí" />
      </div>

      <div className="quick-grid">
        <button className="quick-card" onClick={() => setModal('customer')}>
          <span className="quick-icon teal-bg"><Users size={20} /></span>
          <span><strong>Thêm khách hàng</strong><small>Lưu thông tin và theo dõi nợ</small></span>
          <Plus size={17} />
        </button>
        <button className="quick-card" onClick={() => setModal('product')}>
          <span className="quick-icon blue-bg"><ShoppingBag size={20} /></span>
          <span><strong>Thêm sản phẩm</strong><small>Cập nhật bảng giá bán</small></span>
          <Plus size={17} />
        </button>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div><h3>Giao dịch gần đây</h3><p>Các giao dịch mới nhất</p></div>
          <button className="text-button" onClick={() => setPage('transactions')}>
            Xem tất cả →
          </button>
        </div>
        {recent.length
          ? <TransactionTable transactions={recent} customers={customers} />
          : <Empty text="Chưa có giao dịch nào." />}
      </section>

      <p className="footnote">
        * Chưa phải lợi nhuận kế toán: chưa tính đầy đủ giá vốn, hàng tồn kho hoặc các điều chỉnh.
      </p>
    </div>
  )
}
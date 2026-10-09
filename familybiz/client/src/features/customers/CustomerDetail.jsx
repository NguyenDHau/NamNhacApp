
import { useMemo, useState } from 'react'
import { ArrowLeft, Wallet } from 'lucide-react'
import { createId, money, today } from '../../utils/format.js'

export default function CustomerDetail({ customer, transactions, onBack, onSavePayment }) {
  const [showPayment, setShowPayment] = useState(false)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')

  const customerTransactions = useMemo(() =>
    transactions
      .filter(t => t.customerId === customer.id)
      .sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [transactions, customer.id]
  )

  const sales = customerTransactions.filter(t => t.type === 'SALE')
  const payments = customerTransactions.filter(t => t.type === 'PAYMENT_RECEIVED')

  const debtOrders = useMemo(() => {
    let remainingPayments = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0), 0
    )

    return sales.map(sale => {
      const saleAmount = Number(sale.amount || 0)
      const initiallyUnpaid = Math.max(
        0,
        saleAmount - Number(sale.paidAmount || 0)
      )

      const appliedPayment = Math.min(initiallyUnpaid, remainingPayments)
      remainingPayments -= appliedPayment

      return {
        ...sale,
        remainingDebt: Math.max(0, initiallyUnpaid - appliedPayment)
      }
    })
  }, [sales, payments])

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0)
  const totalPaidAtSale = sales.reduce((sum, sale) => sum + Number(sale.paidAmount || 0), 0)
  const totalCollected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalDebt = debtOrders.reduce((sum, sale) => sum + sale.remainingDebt, 0)

  function submitPayment(event) {
    event.preventDefault()
    const value = Number(amount)

    if (!Number.isFinite(value) || value <= 0 || value > totalDebt) {
      window.alert('Số tiền thu phải lớn hơn 0 và không vượt quá số nợ hiện tại.')
      return
    }

    onSavePayment({
      id: createId(),
      type: 'PAYMENT_RECEIVED',
      customerId: customer.id,
      amount: value,
      paidAmount: value,
      date,
      note: note.trim(),
      items: [],
      createdAt: new Date().toISOString()
    })

    setAmount('')
    setNote('')
    setShowPayment(false)
  }

  return (
    <div className="page-content">
      <button className="secondary-button" onClick={onBack}>
        <ArrowLeft size={16} /> Quay lại danh sách
      </button>

      <div className="welcome-row" style={{ marginTop: 16 }}>
        <div>
          <h2>{customer.name}</h2>
          <p>{customer.phone || 'Chưa có số điện thoại'}</p>
          {customer.address && <p>{customer.address}</p>}
        </div>
        <button
          className="primary-button"
          disabled={totalDebt <= 0}
          onClick={() => setShowPayment(value => !value)}
        >
          <Wallet size={17} /> Thu nợ
        </button>
      </div>

      {showPayment && (
        <div className="panel" style={{ padding: 18, marginBottom: 18 }}>
          <div className="panel-heading">
            <div><h3>Ghi nhận thu nợ</h3><p>Nợ hiện tại: {money(totalDebt)}</p></div>
          </div>
          <form onSubmit={submitPayment}>
            <div className="form-grid">
              <label>Số tiền thu (VNĐ)
                <input
                  type="number"
                  min="1"
                  max={totalDebt}
                  required
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder="Nhập số tiền"
                />
              </label>
              <label>Ngày thu
                <input
                  type="date"
                  required
                  value={date}
                  onChange={event => setDate(event.target.value)}
                />
              </label>
            </div>
            <label>Ghi chú
              <input
                value={note}
                onChange={event => setNote(event.target.value)}
                placeholder="Ví dụ: Khách chuyển khoản"
              />
            </label>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setShowPayment(false)}>
                Hủy
              </button>
              <button type="submit" className="primary-button">Lưu khoản thu</button>
            </div>
          </form>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Tổng mua hàng</div>
          <div className="stat-value">{money(totalSales)}</div>
          <div className="stat-foot">{sales.length} đơn hàng</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đã trả khi mua</div>
          <div className="stat-value">{money(totalPaidAtSale)}</div>
          <div className="stat-foot">Tiền thanh toán tại thời điểm bán</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đã thu nợ</div>
          <div className="stat-value">{money(totalCollected)}</div>
          <div className="stat-foot">Các lần thanh toán công nợ</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Còn nợ</div>
          <div className="stat-value debt-text">{money(totalDebt)}</div>
          <div className="stat-foot">Số tiền khách chưa thanh toán</div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div><h3>Đơn hàng còn nợ</h3><p>Chi tiết sản phẩm theo từng lần mua</p></div>
        </div>
        {!debtOrders.some(order => order.remainingDebt > 0) ? (
          <div className="empty-state"><strong>Khách hàng không còn công nợ.</strong></div>
        ) : debtOrders.filter(order => order.remainingDebt > 0).map(order => (
          <div key={order.id} style={{ padding: 16, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <strong>Đơn ngày {order.date || '—'}</strong>
                {order.note && <p>{order.note}</p>}
              </div>
              <strong className="debt-text">{money(order.remainingDebt)}</strong>
            </div>

            {(order.items || []).length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Sản phẩm</th><th className="right">Số lượng</th><th className="right">Đơn giá</th><th className="right">Thành tiền</th></tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={`${order.id}-${item.productId || item.productName}-${index}`}>
                        <td>{item.productName || 'Sản phẩm'}</td>
                        <td className="right">{item.quantity ?? item.qty ?? 1} {item.unit || ''}</td>
                        <td className="right">{money(item.unitPrice ?? item.price ?? 0)}</td>
                        <td className="right">{money(item.lineTotal ?? item.subtotal ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Đơn hàng cũ chưa có danh sách sản phẩm chi tiết.</p>
            )}
          </div>
        ))}
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <div><h3>Lịch sử thu nợ</h3><p>{payments.length} lần thu</p></div>
        </div>
        {payments.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ngày</th><th>Ghi chú</th><th className="right">Số tiền thu</th></tr></thead>
              <tbody>
                {[...payments].reverse().map(payment => (
                  <tr key={payment.id}>
                    <td>{payment.date || '—'}</td>
                    <td>{payment.note || 'Thu nợ'}</td>
                    <td className="right">{money(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><strong>Chưa có lần thu nợ nào.</strong></div>
        )}
      </section>
    </div>
  )
}
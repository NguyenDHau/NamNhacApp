
import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createId, money, today } from '../../utils/format.js'

export default function TransactionForm({ customers, products, onSave, onClose }) {
  const [customerId, setCustomerId] = useState('')
  const [paymentMode, setPaymentMode] = useState('paid')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [lines, setLines] = useState([
    { key: createId(), productId: '', quantity: '1' }
  ])

  const items = useMemo(() => lines.map(line => {
    const product = products.find(p => p.id === line.productId)
    const quantity = Math.max(0, Number(line.quantity || 0))
    const unitPrice = Number(product?.sellingPrice || 0)

    return {
      productId: line.productId,
      productName: product?.name || '',
      sku: product?.code || '',
      unit: product?.unit || '',
      quantity,
      unitPrice,
      lineTotal: quantity * unitPrice
    }
  }), [lines, products])

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0)

  function updateLine(key, field, value) {
    setLines(current => current.map(line =>
      line.key === key ? { ...line, [field]: value } : line
    ))
  }

  function submit(event) {
    event.preventDefault()

    if (!customerId) {
      window.alert('Vui lòng chọn khách hàng.')
      return
    }

    const validItems = items.filter(item =>
      item.productId && item.quantity > 0
    )

    if (!validItems.length) {
      window.alert('Vui lòng chọn ít nhất một sản phẩm và nhập số lượng hợp lệ.')
      return
    }

    if (total <= 0) {
      window.alert('Tổng tiền phải lớn hơn 0. Hãy kiểm tra giá bán của sản phẩm.')
      return
    }

    onSave({
      id: createId(),
      type: 'SALE',
      customerId,
      amount: total,
      paidAmount: paymentMode === 'paid' ? total : 0,
      date,
      note: note.trim(),
      items: validItems,
      createdAt: new Date().toISOString()
    })
  }

  return (
    <form onSubmit={submit}>
      <label>Khách hàng <b>*</b>
        <select
          required
          value={customerId}
          onChange={event => setCustomerId(event.target.value)}
        >
          <option value="">Chọn khách hàng</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.name} {customer.phone ? `— ${customer.phone}` : ''}
            </option>
          ))}
        </select>
      </label>

      <div className="panel-heading">
        <div>
          <h3>Sản phẩm khách mua</h3>
          <p>Chọn sản phẩm và số lượng cần bán.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setLines(current => [
            ...current,
            { key: createId(), productId: '', quantity: '1' }
          ])}
        >
          <Plus size={16} /> Thêm dòng
        </button>
      </div>

      {lines.map(line => {
        const product = products.find(p => p.id === line.productId)
        const quantity = Math.max(0, Number(line.quantity || 0))
        const lineTotal = quantity * Number(product?.sellingPrice || 0)

        return (
          <div
            key={line.key}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: 12,
              marginBottom: 12
            }}
          >
            <label>Sản phẩm
              <select
                value={line.productId}
                onChange={event =>
                  updateLine(line.key, 'productId', event.target.value)
                }
              >
                <option value="">Chọn sản phẩm</option>
                {products.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {money(item.sellingPrice)}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label>Số lượng
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={line.quantity}
                  onChange={event =>
                    updateLine(line.key, 'quantity', event.target.value)
                  }
                />
              </label>

              <label>Thành tiền
                <input readOnly value={money(lineTotal)} />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <small>{product ? `Đơn vị: ${product.unit || '—'}` : 'Chưa chọn sản phẩm'}</small>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setLines(current => current.filter(item => item.key !== line.key))
                  }
                >
                  <Trash2 size={15} /> Xóa dòng
                </button>
              )}
            </div>
          </div>
        )
      })}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          marginBottom: 16,
          borderRadius: 10,
          background: '#f0fdfa'
        }}
      >
        <strong>Tổng đơn hàng</strong>
        <strong style={{ fontSize: 20, color: '#0f766e' }}>{money(total)}</strong>
      </div>

      <label>Trạng thái thanh toán</label>
      <div className="form-grid">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="radio"
            name="paymentMode"
            checked={paymentMode === 'paid'}
            onChange={() => setPaymentMode('paid')}
          />
          Đã thanh toán
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="radio"
            name="paymentMode"
            checked={paymentMode === 'debt'}
            onChange={() => setPaymentMode('debt')}
          />
          Ghi nợ
        </label>
      </div>

      {paymentMode === 'debt' && (
        <p style={{ color: '#c2410c' }}>
          Công nợ phát sinh: <strong>{money(total)}</strong>
        </p>
      )}

      <div className="form-grid">
        <label>Ngày giao dịch
          <input
            type="date"
            required
            value={date}
            onChange={event => setDate(event.target.value)}
          />
        </label>
        <label>Ghi chú
          <input
            value={note}
            onChange={event => setNote(event.target.value)}
            placeholder="Ví dụ: Giao hàng lần 1"
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onClose}>
          Hủy
        </button>
        <button type="submit" className="primary-button">
          Lưu giao dịch
        </button>
      </div>
    </form>
  )
}
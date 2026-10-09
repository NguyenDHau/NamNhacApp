import { useState } from 'react'
import { Plus, Search, ArrowLeft } from 'lucide-react'
import { createId, money } from '../../utils/format.js'
import Empty from '../../components/common/Empty.jsx'
import Modal from '../../components/common/Modal.jsx'
import CustomerDetail from './CustomerDetail.jsx'

function CustomerForm({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  function submit(event) {
    event.preventDefault()
    if (!name.trim()) return

    onSave({
      id: createId(),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString()
    })
  }

  return (
    <form onSubmit={submit}>
      <label>Tên khách hàng <b>*</b>
        <input required autoFocus value={name} onChange={e => setName(e.target.value)} />
      </label>
      <label>Số điện thoại
        <input value={phone} onChange={e => setPhone(e.target.value)} />
      </label>
      <label>Địa chỉ
        <input value={address} onChange={e => setAddress(e.target.value)} />
      </label>
      <label>Ghi chú
        <textarea value={note} onChange={e => setNote(e.target.value)} />
      </label>
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
        <button type="submit" className="primary-button">Lưu khách hàng</button>
      </div>
    </form>
  )
}

export default function Customers({
  customers,
  transactions,
  onSave,
  onSavePayment
}) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  const rows = customers
    .filter(customer =>
      `${customer.name} ${customer.phone || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .map(customer => {
      const sales = transactions
        .filter(t => t.type === 'SALE' && t.customerId === customer.id)
        .reduce((sum, t) => sum + Math.max(
          0,
          Number(t.amount || 0) - Number(t.paidAmount || 0)
        ), 0)

      const payments = transactions
        .filter(t => t.type === 'PAYMENT_RECEIVED' && t.customerId === customer.id)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)

      return { ...customer, debt: Math.max(0, sales - payments) }
    })

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  if (selectedCustomer) {
    return (
      <div>
        <CustomerDetail
          customer={selectedCustomer}
          transactions={transactions}
          onBack={() => setSelectedCustomerId(null)}
          onSavePayment={onSavePayment}
        />
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="list-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Tìm tên hoặc số điện thoại…"
          />
        </div>
        <button className="primary-button" onClick={() => setShowForm(true)}>
          <Plus size={17} /> Thêm khách hàng
        </button>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Danh sách khách hàng</h3>
            <p>{customers.length} khách hàng</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Ghi chú</th>
                <th className="right">Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(customer => (
                <tr key={customer.id}>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'inherit',
                        textAlign: 'left'
                      }}
                    >
                      <div className="person-cell">
                        <span className="person-avatar">
                          {(customer.name || '?').slice(0, 1).toUpperCase()}
                        </span>
                        <strong>{customer.name}</strong>
                      </div>
                    </button>
                  </td>
                  <td>{customer.phone || '—'}</td>
                  <td>{customer.note || '—'}</td>
                  <td className={`right ${customer.debt ? 'debt-text' : ''}`}>
                    {money(customer.debt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty text="Không tìm thấy khách hàng." />}
        </div>
      </div>

      {showForm && (
        <Modal title="Thêm khách hàng" close={() => setShowForm(false)}>
          <CustomerForm
            onClose={() => setShowForm(false)}
            onSave={record => {
              onSave(record)
              setShowForm(false)
            }}
          />
        </Modal>
      )}
    </div>
  )
}
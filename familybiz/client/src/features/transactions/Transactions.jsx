import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { money } from '../../utils/format.js'
import Empty from '../../components/common/Empty.jsx'
import Modal from '../../components/common/Modal.jsx'
import TransactionForm from './TransactionForm.jsx'

export function TransactionTable({
  transactions,
  customers,
  onEdit,
  onDelete
}) {
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
            <th>Ngày</th>
            <th>Loại</th>
            <th>Khách hàng / nội dung</th>
            <th className="right">Giá trị</th>
            <th className="right">Còn nợ</th>
            <th>Thao tác</th>
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

                <td>
                  <span className={`type-pill ${cls}`}>{label}</span>
                </td>

                <td>
                  <strong>{customer || t.note || 'Giao dịch'}</strong>

                  {customer && t.note && (
                    <small className="cell-sub">{t.note}</small>
                  )}

                  {t.type === 'SALE' && Array.isArray(t.items) && t.items.length > 0 && (
                    <small className="cell-sub">
                      {t.items.map((item, index) =>
                        `${item.productName || 'Sản phẩm'} × ${item.quantity}`
                      ).join(', ')}
                    </small>
                  )}
                </td>

                <td className="right">{money(t.amount)}</td>

                <td className={`right ${debt ? 'debt-text' : ''}`}>
                  {money(debt)}
                </td>

                <td>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      title="Sửa giao dịch"
                      aria-label="Sửa giao dịch"
                      onClick={() => onEdit?.(t)}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      title="Xóa giao dịch"
                      aria-label="Xóa giao dịch"
                      onClick={() => onDelete?.(t)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Transactions({
  transactions = [],
  customers = [],
  products = [],
  onSave,
  onDelete
}) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return [...transactions]
      .filter(t => {
        const customer =
          customers.find(c => c.id === t.customerId)?.name || ''

        const productNames = (t.items || [])
          .map(item => `${item.productName || ''} ${item.sku || ''}`)
          .join(' ')

        return `${customer} ${t.note || ''} ${t.type} ${productNames}`
          .toLowerCase()
          .includes(keyword)
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [transactions, customers, search])

  function openCreate() {
    setEditingTransaction(null)
    setShowForm(true)
  }

  function openEdit(transaction) {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingTransaction(null)
  }

  function handleDelete(transaction) {
    if (!onDelete) {
      window.alert('Chức năng xóa chưa được kết nối trong FamilyBizApp.jsx.')
      return
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa giao dịch ngày ${transaction.date || 'không xác định'} với giá trị ${money(transaction.amount)}?`
    )

    if (confirmed) {
      onDelete(transaction)
    }
  }

  return (
    <div className="page-content">
      <div className="list-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Tìm khách hàng, sản phẩm hoặc giao dịch…"
          />
        </div>

        <button className="primary-button" onClick={openCreate}>
          <Plus size={17} /> Thêm giao dịch
        </button>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Lịch sử giao dịch</h3>
            <p>{transactions.length} giao dịch</p>
          </div>
        </div>

        {rows.length ? (
          <TransactionTable
            transactions={rows}
            customers={customers}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ) : (
          <Empty text="Chưa có giao dịch phù hợp." />
        )}
      </div>

      {showForm && (
        <Modal
          title={editingTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch bán hàng'}
          close={closeForm}
        >
          <TransactionForm
            key={editingTransaction?.id || 'new-transaction'}
            transaction={editingTransaction}
            customers={customers}
            products={products}
            onClose={closeForm}
            onSave={record => {
              onSave(record)
              closeForm()
            }}
          />
        </Modal>
      )}
    </div>
  )
}
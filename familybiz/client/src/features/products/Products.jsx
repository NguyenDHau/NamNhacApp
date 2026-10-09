
// import { useState } from 'react'
// import { Plus, Search } from 'lucide-react'
// import { createId, money } from '../../utils/format.js'
// import Empty from '../../components/common/Empty.jsx'
// import Modal from '../../components/common/Modal.jsx'

// function ProductForm({ onSave, onClose }) {
//   const [code, setCode] = useState('')
//   const [name, setName] = useState('')
//   const [unit, setUnit] = useState('cái')
//   const [costPrice, setCostPrice] = useState('0')
//   const [sellingPrice, setSellingPrice] = useState('0')
//   const [note, setNote] = useState('')

//   return (
//     <form onSubmit={event => {
//       event.preventDefault()
//       if (!name.trim()) return

//       onSave({
//         id: createId(),
//         code: code.trim(),
//         name: name.trim(),
//         unit: unit.trim(),
//         costPrice: Number(costPrice),
//         sellingPrice: Number(sellingPrice),
//         note: note.trim(),
//         createdAt: new Date().toISOString()
//       })
//     }}>
//       <div className="form-grid">
//         <label>Mã sản phẩm
//           <input value={code} onChange={e => setCode(e.target.value)} placeholder="SP001" />
//         </label>
//         <label>Đơn vị
//           <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="cái, kg…" />
//         </label>
//       </div>
//       <label>Tên sản phẩm / dịch vụ <b>*</b>
//         <input required value={name} onChange={e => setName(e.target.value)} />
//       </label>
//       <div className="form-grid">
//         <label>Giá vốn (VNĐ)
//           <input type="number" min="0" required value={costPrice} onChange={e => setCostPrice(e.target.value)} />
//         </label>
//         <label>Giá bán (VNĐ)
//           <input type="number" min="0" required value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
//         </label>
//       </div>
//       <label>Ghi chú
//         <textarea value={note} onChange={e => setNote(e.target.value)} />
//       </label>
//       <div className="form-actions">
//         <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
//         <button className="primary-button" type="submit">Lưu sản phẩm</button>
//       </div>
//     </form>
//   )
// }

// export default function Products({ products, onSave }) {
//   const [search, setSearch] = useState('')
//   const [showForm, setShowForm] = useState(false)

//   const rows = products.filter(p =>
//     `${p.name || ''} ${p.code || ''}`.toLowerCase().includes(search.toLowerCase())
//   )

//   return (
//     <div className="page-content">
//       <div className="list-toolbar">
//         <div className="search-box">
//           <Search size={17} />
//           <input value={search} onChange={e => setSearch(e.target.value)}
//             placeholder="Tìm tên hoặc mã sản phẩm…" />
//         </div>
//         <button className="primary-button" onClick={() => setShowForm(true)}>
//           <Plus size={17} /> Thêm sản phẩm
//         </button>
//       </div>

//       <div className="panel">
//         <div className="panel-heading">
//           <div><h3>Bảng giá</h3><p>{products.length} sản phẩm / dịch vụ</p></div>
//         </div>
//         <div className="table-wrap">
//           <table>
//             <thead><tr><th>Mã</th><th>Tên sản phẩm</th><th>Đơn vị</th><th className="right">Giá vốn</th><th className="right">Giá bán</th></tr></thead>
//             <tbody>
//               {rows.map(p => (
//                 <tr key={p.id}>
//                   <td><span className="code-pill">{p.code || '—'}</span></td>
//                   <td><strong>{p.name}</strong></td>
//                   <td>{p.unit || '—'}</td>
//                   <td className="right">{money(p.costPrice)}</td>
//                   <td className="right price-text">{money(p.sellingPrice)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {!rows.length && <Empty text="Chưa có sản phẩm phù hợp." />}
//         </div>
//       </div>

//       {showForm && (
//         <Modal title="Thêm sản phẩm / bảng giá" close={() => setShowForm(false)}>
//           <ProductForm
//             onClose={() => setShowForm(false)}
//             onSave={record => {
//               onSave(record)
//               setShowForm(false)
//             }}
//           />
//         </Modal>
//       )}
//     </div>
//   )
// }


import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { createId, money } from '../../utils/format.js'
import Empty from '../../components/common/Empty.jsx'
import Modal from '../../components/common/Modal.jsx'

function ProductForm({ product, onSave, onClose }) {
  const [code, setCode] = useState(product?.code || '')
  const [name, setName] = useState(product?.name || '')
  const [unit, setUnit] = useState(product?.unit || 'cái')
  const [costPrice, setCostPrice] = useState(
    String(product?.costPrice ?? 0)
  )
  const [sellingPrice, setSellingPrice] = useState(
    String(product?.sellingPrice ?? 0)
  )
  const [note, setNote] = useState(product?.note || '')

  function submit(event) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) return

    onSave({
      id: product?.id || createId(),
      code: code.trim(),
      name: trimmedName,
      unit: unit.trim() || 'cái',
      costPrice: Math.max(0, Number(costPrice) || 0),
      sellingPrice: Math.max(0, Number(sellingPrice) || 0),
      note: note.trim(),
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <label>
          Mã sản phẩm
          <input
            value={code}
            onChange={event => setCode(event.target.value)}
            placeholder="SP001"
          />
        </label>

        <label>
          Đơn vị
          <input
            value={unit}
            onChange={event => setUnit(event.target.value)}
            placeholder="cái, kg…"
          />
        </label>
      </div>

      <label>
        Tên sản phẩm / dịch vụ <b>*</b>
        <input
          required
          value={name}
          onChange={event => setName(event.target.value)}
          autoFocus
        />
      </label>

      <div className="form-grid">
        <label>
          Giá vốn (VNĐ)
          <input
            type="number"
            min="0"
            required
            value={costPrice}
            onChange={event => setCostPrice(event.target.value)}
          />
        </label>

        <label>
          Giá bán (VNĐ)
          <input
            type="number"
            min="0"
            required
            value={sellingPrice}
            onChange={event => setSellingPrice(event.target.value)}
          />
        </label>
      </div>

      <label>
        Ghi chú
        <textarea
          value={note}
          onChange={event => setNote(event.target.value)}
        />
      </label>

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
        >
          Hủy
        </button>

        <button className="primary-button" type="submit">
          {product ? 'Lưu thay đổi' : 'Lưu sản phẩm'}
        </button>
      </div>
    </form>
  )
}

export default function Products({ products = [], onSave, onDelete }) {
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return products.filter(product =>
      `${product.name || ''} ${product.code || ''}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [products, search])

  function openCreate() {
    setEditingProduct(null)
    setShowForm(true)
  }

  function openEdit(product) {
    setEditingProduct(product)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingProduct(null)
  }

  function handleDelete(product) {
    if (!onDelete) {
      window.alert('Chức năng xóa chưa được kết nối ở FamilyBizApp.jsx.')
      return
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sản phẩm "${product.name}" không?`
    )

    if (confirmed) onDelete(product.id)
  }

  return (
    <div className="page-content">
      <div className="list-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Tìm tên hoặc mã sản phẩm…"
          />
        </div>

        <button className="primary-button" onClick={openCreate}>
          <Plus size={17} /> Thêm sản phẩm
        </button>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Bảng giá</h3>
            <p>{products.length} sản phẩm / dịch vụ</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên sản phẩm</th>
                <th>Đơn vị</th>
                <th className="right">Giá vốn</th>
                <th className="right">Giá bán</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(product => (
                <tr key={product.id}>
                  <td>
                    <span className="code-pill">
                      {product.code || '—'}
                    </span>
                  </td>

                  <td>
                    <strong>{product.name}</strong>
                  </td>

                  <td>{product.unit || '—'}</td>

                  <td className="right">
                    {money(product.costPrice)}
                  </td>

                  <td className="right price-text">
                    {money(product.sellingPrice)}
                  </td>

                  <td>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => openEdit(product)}
                        title="Sửa sản phẩm"
                        aria-label={`Sửa ${product.name}`}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleDelete(product)}
                        title="Xóa sản phẩm"
                        aria-label={`Xóa ${product.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!rows.length && (
            <Empty text="Chưa có sản phẩm phù hợp." />
          )}
        </div>
      </div>

      {showForm && (
        <Modal
          title={
            editingProduct
              ? 'Sửa sản phẩm / dịch vụ'
              : 'Thêm sản phẩm / bảng giá'
          }
          close={closeForm}
        >
          <ProductForm
            product={editingProduct}
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

import { X } from 'lucide-react'

export default function Modal({ title, close, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="modal">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={close}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
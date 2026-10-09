
import { Search } from 'lucide-react'

export default function Empty({ text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Search size={22} />
      </div>
      <strong>{text}</strong>
    </div>
  )
}
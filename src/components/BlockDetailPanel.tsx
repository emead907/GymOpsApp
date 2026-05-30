type Block = {
  id: string
  title: string
  time: string
  staff: string
  capacity: string
  enrolled: number
  type: string
  location: string
  notes?: string
}

const typeColors: Record<string, string> = {
  camp: "bg-blue-500",
  class: "bg-violet-500",
  team: "bg-green-500",
  party: "bg-pink-500",
  openGym: "bg-orange-500",
  preschool: "bg-yellow-400",
  event: "bg-red-500",
}

export default function BlockDetailPanel({ block, onClose, onDelete }: { block: Block; onClose: () => void; onDelete?: (id: string) => void }) {
  const capacity = parseInt(block.capacity) || 0
  const enrollPct = capacity > 0 ? Math.round((block.enrolled / capacity) * 100) : 0

  const initials = block.staff
    ? block.staff.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  return (
    <div className="w-80 bg-white border-l border-gray-100 flex flex-col h-full overflow-y-auto shadow-lg">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h3 className="text-lg font-bold text-gray-900">Block Details</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
        >
          ✕
        </button>
      </div>

      {/* Color Banner */}
      <div className={`mx-6 rounded-2xl p-5 mb-5 ${typeColors[block.type] ?? "bg-gray-400"}`}>
        <p className="text-white font-bold text-lg">{block.title}</p>
        <p className="text-white/80 text-sm mt-0.5">{block.location}</p>
      </div>

      <div className="px-6 space-y-5">

        {/* Time */}
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-0.5">🕐</span>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Time</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{block.time}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-0.5">📍</span>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Location</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{block.location}</p>
          </div>
        </div>

        {/* Staff */}
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-0.5">👤</span>
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Staff Assigned</p>
            {block.staff ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{block.staff}</p>
                  <p className="text-xs text-gray-400">Lead Coach</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No staff assigned</p>
            )}
          </div>
        </div>

        {/* Enrollment */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Enrollment</p>
            <p className="text-sm font-bold text-gray-800">{block.enrolled} / {block.capacity || "—"}</p>
          </div>
          {capacity > 0 && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${enrollPct > 90 ? "bg-red-500" : enrollPct > 70 ? "bg-orange-400" : "bg-green-500"}`}
                style={{ width: `${Math.min(enrollPct, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        {block.notes && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{block.notes}</p>
          </div>
        )}

      </div>

      {/* Actions */}
      <div className="px-6 pb-6 mt-auto pt-6 space-y-2">
        <button className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-2xl text-sm font-semibold transition">
          Edit Block
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(block.id)}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-2xl text-sm font-semibold transition"
          >
            Delete Block
          </button>
        )}
      </div>

    </div>
  )
}

"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Block = {
  id: string
  title: string
  time: string
  staff: string
  coach_id?: string
  coaches?: { id: string; name: string }[]
  capacity: string
  enrolled: number
  type: string
  location: string
  notes?: string
  start_time: string
  end_time: string
  date: string
  recurring_shift_id?: string
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

// Generate the next N occurrences of a given day_of_week starting from today
function getNextDates(dayOfWeek: number, weeks: number): string[] {
  const dates: string[] = []
  const today = new Date()
  const daysUntil = (dayOfWeek - today.getDay() + 7) % 7
  for (let w = 0; w < weeks; w++) {
    const d = new Date(today)
    d.setDate(today.getDate() + daysUntil + w * 7)
    dates.push(d.toISOString().split("T")[0])
  }
  return dates
}

export default function BlockDetailPanel({
  block,
  onClose,
  onDelete,
  onRefresh,
  onEdit,
}: {
  block: Block
  onClose: () => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit?: (block: any) => void
}) {
  const [makingRecurring, setMakingRecurring] = useState(false)
  const [recurringDone, setRecurringDone] = useState(!!block.recurring_shift_id)

  const supabase = createClient()
  const capacity = parseInt(block.capacity) || 0
  const enrollPct = capacity > 0 ? Math.round((block.enrolled / capacity) * 100) : 0
  const initials = block.staff
    ? block.staff.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  async function handleMakeRecurring() {
    if (!block.date) return
    setMakingRecurring(true)

    const blockDate = new Date(block.date + "T00:00:00")
    const dayOfWeek = blockDate.getDay()

    // 1. Create the recurring shift
    const { data: recurring, error } = await supabase
      .from("recurring_shifts")
      .insert({
        title: block.title,
        type: block.type,
        day_of_week: dayOfWeek,
        start_time: block.start_time,
        end_time: block.end_time,
        location: block.location,
        assigned_coach_id: block.coach_id ?? null,
        source_block_id: block.id,
        active: true,
      })
      .select()
      .single()

    if (error || !recurring) {
      setMakingRecurring(false)
      return
    }

    // 2. Link the original block to the recurring shift
    await supabase
      .from("schedule_blocks")
      .update({ recurring_shift_id: recurring.id })
      .eq("id", block.id)

    // 3. Generate next 12 weeks of schedule blocks (skip today's date since it exists)
    const dates = getNextDates(dayOfWeek, 13).slice(1) // skip week 0 (current block)
    const newBlocks = dates.map((date) => ({
      title: block.title,
      type: block.type,
      start_time: block.start_time,
      end_time: block.end_time,
      location: block.location,
      staff: block.staff,
      coach_id: block.coach_id ?? null,
      capacity: parseInt(block.capacity) || null,
      enrolled: 0,
      date,
      recurring_shift_id: recurring.id,
    }))

    await supabase.from("schedule_blocks").insert(newBlocks)

    setRecurringDone(true)
    setMakingRecurring(false)
    onRefresh?.()
  }

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
        {recurringDone && (
          <span className="inline-block mt-2 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            🔁 Recurring
          </span>
        )}
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
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
              {block.type === "team" ? "Coaches" : "Coach"}
            </p>
            {block.type === "team" ? (
              block.coaches && block.coaches.length > 0 ? (
                <div className="space-y-2">
                  {block.coaches.map((c) => {
                    const ini = c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                          {ini}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No coaches assigned</p>
              )
            ) : block.staff ? (
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
              <p className="text-sm text-gray-400 italic">No coach assigned</p>
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

        {/* Recurring status */}
        {recurringDone && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-violet-800">🔁 Recurring shift active</p>
            <p className="text-xs text-violet-600 mt-0.5">Next 12 weeks auto-populated on the schedule.</p>
          </div>
        )}

      </div>

      {/* Actions */}
      <div className="px-6 pb-6 mt-auto pt-6 space-y-2">
        {!recurringDone && (
          <button
            onClick={handleMakeRecurring}
            disabled={makingRecurring}
            className="w-full bg-violet-100 hover:bg-violet-200 text-violet-700 py-2.5 rounded-2xl text-sm font-semibold transition disabled:opacity-60"
          >
            {makingRecurring ? "Creating recurring shift..." : "🔁 Make Recurring"}
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(block)}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-2xl text-sm font-semibold transition"
          >
            Edit Block
          </button>
        )}
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

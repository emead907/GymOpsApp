"use client"

import { useState, useEffect, useCallback } from "react"
import BlockDetailPanel from "@/components/BlockDetailPanel"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleItem = {
  id: string
  title: string
  time: string
  staff: string
  coach_id?: string
  coaches?: { id: string; name: string }[]
  capacity: string
  enrolled: number
  type: "camp" | "class" | "team" | "party" | "openGym" | "preschool" | "event"
  location: string
  startHour: string
  startTime: string
  endTime: string
  start_time: string
  end_time: string
  notes?: string
  date: string
  recurring_shift_id?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

// The three display columns and which DB location values map into each
const COLUMNS = [
  { label: "Little Gym",    locations: ["Little Gym", "Preschool Room", "Classrooms"] },
  { label: "Big Gym",       locations: ["Big Gym"] },
  { label: "Events / Camps", locations: ["Party Room", "Camp", "Events / Camps"] },
]
// Flat list for the location dropdown when adding/editing blocks
const LOCATIONS = ["Little Gym", "Big Gym", "Party Room", "Preschool Room", "Classrooms", "Events / Camps"]

const START_HOUR = 8
const END_HOUR = 20
const HOUR_HEIGHT = 64
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

const TYPE_STYLE: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  camp:     { bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-900",   bar: "bg-blue-500"   },
  class:    { bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-900", bar: "bg-violet-500" },
  team:     { bg: "bg-green-50",   border: "border-green-200",  text: "text-green-900",  bar: "bg-green-500"  },
  party:    { bg: "bg-pink-50",    border: "border-pink-200",   text: "text-pink-900",   bar: "bg-pink-500"   },
  openGym:  { bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-900", bar: "bg-orange-500" },
  preschool:{ bg: "bg-yellow-50",  border: "border-yellow-200", text: "text-yellow-900", bar: "bg-yellow-400" },
  event:    { bg: "bg-red-50",     border: "border-red-200",    text: "text-red-900",    bar: "bg-red-500"    },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMins(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })
}

function toISODate(date: Date) {
  return date.toISOString().split("T")[0]
}

function offsetDate(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatTimeDisplay(t: string) {
  const [h, m] = t.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${period}`
}

function rowToItem(row: Record<string, unknown>): ScheduleItem {
  const startTime = row.start_time as string
  const endTime = row.end_time as string
  return {
    id: row.id as string,
    title: row.title as string,
    type: row.type as ScheduleItem["type"],
    time: `${formatTimeDisplay(startTime)} – ${formatTimeDisplay(endTime)}`,
    staff: (row.staff as string) ?? "",
    capacity: String(row.capacity ?? ""),
    enrolled: (row.enrolled as number) ?? 0,
    location: row.location as string,
    startTime,
    endTime,
    start_time: startTime,
    end_time: endTime,
    startHour: startTime.slice(0, 2),
    notes: (row.notes as string) ?? "",
    date: row.date as string,
    coach_id: (row.coach_id as string) ?? undefined,
    recurring_shift_id: (row.recurring_shift_id as string) ?? undefined,
  }
}

// Lay blocks side-by-side when they overlap within a column
function layoutBlocks(blocks: ScheduleItem[]) {
  if (!blocks.length) return []
  const sorted = [...blocks].sort((a, b) => toMins(a.startTime) - toMins(b.startTime))
  const colEnds: number[] = []
  const withCol = sorted.map(b => {
    const s = toMins(b.startTime)
    let col = colEnds.findIndex(e => e <= s)
    if (col === -1) { col = colEnds.length; colEnds.push(0) }
    colEnds[col] = toMins(b.endTime)
    return { ...b, col }
  })
  return withCol.map(b => {
    const bs = toMins(b.startTime), be = toMins(b.endTime)
    let maxCol = b.col
    withCol.forEach(o => {
      if (toMins(o.startTime) < be && toMins(o.endTime) > bs) maxCol = Math.max(maxCol, o.col)
    })
    return { ...b, totalCols: maxCol + 1 }
  })
}

// ─── Timeline Column ──────────────────────────────────────────────────────────

function TimelineColumn({
  blocks,
  label,
  onSelect,
}: {
  blocks: ScheduleItem[]
  label: string
  onSelect: (item: ScheduleItem) => void
}) {
  const laid = layoutBlocks(blocks)

  return (
    <div className="flex-1 min-w-[140px] flex flex-col border-l border-gray-100 first:border-l-0">
      {/* Column header */}
      <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider text-center sticky top-0 z-10">
        {label}
      </div>

      {/* Timeline */}
      <div className="relative" style={{ height: TOTAL_HEIGHT }}>
        {/* Hour lines */}
        {HOURS.map(h => (
          <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
        ))}
        {/* Half-hour lines */}
        {HOURS.map(h => (
          <div key={`h-${h}`} className="absolute left-0 right-0 border-t border-gray-50" style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
        ))}

        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-gray-200 font-medium rotate-0">Empty</p>
          </div>
        )}

        {laid.map((b) => {
          const top = (toMins(b.startTime) - START_HOUR * 60) / 60 * HOUR_HEIGHT
          const height = (toMins(b.endTime) - toMins(b.startTime)) / 60 * HOUR_HEIGHT
          const s = TYPE_STYLE[b.type] ?? TYPE_STYLE.class
          const showTime = height >= 36
          const showCoach = height >= 48

          return (
            <div
              key={b.id}
              className="absolute px-0.5 py-0.5 cursor-pointer"
              style={{
                top,
                height,
                left: `${b.col * 100 / b.totalCols}%`,
                width: `${100 / b.totalCols}%`,
              }}
              onClick={() => onSelect(b)}
            >
              <div className={`h-full rounded-lg border overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:-translate-y-px transition-all ${s.bg} ${s.border}`}>
                <div className={`h-1 flex-shrink-0 rounded-t-lg ${s.bar}`} />
                <div className="px-1.5 py-1 flex-1 min-h-0 overflow-hidden">
                  <p className={`font-semibold leading-tight text-[11px] ${s.text} line-clamp-2`}>{b.title}</p>
                  {showTime && (
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{b.time}</p>
                  )}
                  {showCoach && b.staff && (
                    <p className={`text-[10px] mt-0.5 font-medium leading-tight ${s.text} opacity-70 truncate`}>
                      {b.staff.split(",").map(n => n.trim().split(" ")[0]).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Time Axis ────────────────────────────────────────────────────────────────

function TimeAxis() {
  return (
    <div className="flex-shrink-0 w-14 bg-white border-r border-gray-100" style={{ paddingTop: "41px" }}>
      <div className="relative" style={{ height: TOTAL_HEIGHT }}>
        {HOURS.map(h => (
          <div
            key={h}
            className="absolute right-2 text-[10px] text-gray-400 font-medium leading-none"
            style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 5 }}
          >
            {h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<ScheduleItem | null>(null)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([])
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([])
  const [activeLocation, setActiveLocation] = useState(COLUMNS[0].label)

  const supabase = createClient()

  useEffect(() => {
    supabase.from("profiles").select("id, full_name").then(({ data }) => {
      setCoaches((data ?? []).map((p) => ({ id: p.id, name: p.full_name ?? "Unknown" })))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBlocks = useCallback(async () => {
    setLoading(true)
    const [{ data, error }, { data: blockCoachesData }, { data: profilesData }] = await Promise.all([
      supabase.from("schedule_blocks").select("*").eq("date", toISODate(currentDate)).order("start_time"),
      supabase.from("schedule_block_coaches").select("block_id, coach_id"),
      supabase.from("profiles").select("id, full_name"),
    ])

    if (!error && data) {
      const nameMap = new Map((profilesData ?? []).map((p) => [p.id, p.full_name ?? "Unknown"]))
      const coachesByBlock = new Map<string, { id: string; name: string }[]>()
      ;(blockCoachesData ?? []).forEach((bc) => {
        if (!coachesByBlock.has(bc.block_id)) coachesByBlock.set(bc.block_id, [])
        coachesByBlock.get(bc.block_id)!.push({ id: bc.coach_id, name: nameMap.get(bc.coach_id) ?? "Unknown" })
      })
      setScheduleItems(data.map((row) => ({
        ...rowToItem(row),
        coaches: coachesByBlock.get(row.id) ?? [],
      })))
    }
    setLoading(false)
  }, [currentDate]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadBlocks() }, [loadBlocks])

  const [formData, setFormData] = useState({
    title: "",
    type: "camp" as ScheduleItem["type"],
    startTime: "",
    endTime: "",
    location: "Big Gym",
    staff: "",
    coach_id: "",
    capacity: "",
    enrolled: "",
    notes: "",
  })

  function openEditBlock(block: ScheduleItem) {
    setEditingBlockId(block.id)
    setFormData({
      title: block.title,
      type: block.type,
      startTime: block.start_time,
      endTime: block.end_time,
      location: block.location,
      staff: block.staff,
      coach_id: block.coach_id ?? "",
      capacity: block.capacity,
      enrolled: String(block.enrolled),
      notes: block.notes ?? "",
    })
    setSelectedCoachIds(block.type === "team" ? (block.coaches ?? []).map((c) => c.id) : [])
    setShowModal(true)
  }

  async function handleSaveBlock() {
    if (!formData.title || !formData.startTime || !formData.endTime) return
    setSaving(true)

    const isTeam = formData.type === "team"
    const selectedCoach = coaches.find((c) => c.id === formData.coach_id)
    const teamCoachNames = coaches.filter((c) => selectedCoachIds.includes(c.id)).map((c) => c.name)
    const staffName = isTeam
      ? (teamCoachNames.join(", ") || null)
      : (selectedCoach ? selectedCoach.name : formData.staff || null)

    const payload = {
      title: formData.title,
      type: formData.type,
      start_time: formData.startTime,
      end_time: formData.endTime,
      location: formData.location,
      staff: staffName,
      coach_id: isTeam ? null : (formData.coach_id || null),
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      enrolled: formData.enrolled ? parseInt(formData.enrolled) : 0,
      notes: formData.notes || null,
    }

    let blockId = editingBlockId
    if (editingBlockId) {
      const { error } = await supabase.from("schedule_blocks").update(payload).eq("id", editingBlockId)
      if (error) { setSaving(false); return }
    } else {
      const { data, error } = await supabase.from("schedule_blocks").insert({ ...payload, date: toISODate(currentDate) }).select().single()
      if (error || !data) { setSaving(false); return }
      blockId = data.id
    }

    if (isTeam && blockId) {
      await supabase.from("schedule_block_coaches").delete().eq("block_id", blockId)
      if (selectedCoachIds.length > 0) {
        await supabase.from("schedule_block_coaches").insert(
          selectedCoachIds.map((coach_id) => ({ block_id: blockId, coach_id }))
        )
      }
    }

    setFormData({ title: "", type: "camp", startTime: "", endTime: "", location: "Big Gym", staff: "", coach_id: "", capacity: "", enrolled: "", notes: "" })
    setSelectedCoachIds([])
    setEditingBlockId(null)
    setShowModal(false)
    setSelectedBlock(null)
    await loadBlocks()
    setSaving(false)
  }

  async function handleDeleteBlock(id: string) {
    await supabase.from("schedule_blocks").delete().eq("id", id)
    setSelectedBlock(null)
    await loadBlocks()
  }

  const filteredItems = search
    ? scheduleItems.filter((i) =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.staff.toLowerCase().includes(search.toLowerCase()) ||
        i.location.toLowerCase().includes(search.toLowerCase())
      )
    : scheduleItems

  const blocksToday = scheduleItems.length
  const staffAssigned = new Set(scheduleItems.map((i) => i.staff).filter(Boolean)).size
  const totalEnrolled = scheduleItems.reduce((sum, i) => sum + i.enrolled, 0)
  const totalCapacity = scheduleItems.reduce((sum, i) => sum + (parseInt(i.capacity) || 0), 0)

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Master Schedule</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              + Add Block
            </button>
          </div>

          {/* Date nav */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setCurrentDate(offsetDate(currentDate, -1))}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 font-bold"
            >‹</button>
            <span className="text-sm font-semibold text-gray-700 flex-1 text-center">{formatDate(currentDate)}</span>
            <button
              onClick={() => setCurrentDate(offsetDate(currentDate, 1))}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 font-bold"
            >›</button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classes, staff, or rooms..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition"
            />
          </div>

          {/* Stat chips */}
          <div className="flex gap-3 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {[
              { label: "Blocks", value: blocksToday, color: "text-blue-700 bg-blue-50" },
              { label: "Staff", value: staffAssigned, color: "text-violet-700 bg-violet-50" },
              { label: "Enrolled", value: `${totalEnrolled}/${totalCapacity || "—"}`, color: "text-green-700 bg-green-50" },
            ].map((c) => (
              <div key={c.label} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${c.color}`}>
                <span>{c.label}</span>
                <span className="font-bold">{c.value}</span>
              </div>
            ))}
          </div>

          {/* Mobile location tabs */}
          <div className="md:hidden flex border-t border-gray-100 -mx-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {COLUMNS.map((col) => (
              <button
                key={col.label}
                onClick={() => setActiveLocation(col.label)}
                className={`flex-shrink-0 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeLocation === col.label
                    ? "text-violet-700 border-b-2 border-violet-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading schedule...</div>
          ) : (
            <>
              {/* Mobile: single column for active tab */}
              <div className="md:hidden flex">
                <TimeAxis />
                {COLUMNS.filter((col) => col.label === activeLocation).map((col) => (
                  <TimelineColumn
                    key={col.label}
                    blocks={filteredItems.filter((i) => col.locations.includes(i.location))}
                    label={col.label}
                    onSelect={setSelectedBlock}
                  />
                ))}
              </div>

              {/* Desktop: three columns */}
              <div className="hidden md:flex min-w-[560px]">
                <TimeAxis />
                {COLUMNS.map((col) => (
                  <TimelineColumn
                    key={col.label}
                    blocks={filteredItems.filter((i) => col.locations.includes(i.location))}
                    label={col.label}
                    onSelect={setSelectedBlock}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Block Detail Panel */}
      {selectedBlock && (
        <BlockDetailPanel
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onDelete={handleDeleteBlock}
          onRefresh={loadBlocks}
          onEdit={openEditBlock}
        />
      )}

      {/* Add / Edit Block Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{editingBlockId ? "Edit Schedule Block" : "Add Schedule Block"}</h2>
                <p className="text-sm text-gray-500 mt-1">{editingBlockId ? "Update the details for this block." : "Create a new class, camp, event, or activity."}</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditingBlockId(null) }} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                  placeholder="Summer Camp" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Block Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as ScheduleItem["type"] })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition">
                  <option value="camp">Camp</option>
                  <option value="class">Class</option>
                  <option value="team">Team</option>
                  <option value="party">Party</option>
                  <option value="preschool">Preschool</option>
                  <option value="event">Event / Field Trip</option>
                  <option value="openGym">Open Gym</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                  <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                  <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition">
                  {LOCATIONS.map((loc) => <option key={loc}>{loc}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.type === "team" ? "Coaches (select all that apply)" : "Coach"}
                </label>
                {formData.type === "team" ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 space-y-2 max-h-44 overflow-y-auto">
                    {coaches.map((c) => (
                      <label key={c.id} className="flex items-center gap-3 cursor-pointer hover:bg-white rounded-xl px-2 py-1.5 transition">
                        <input
                          type="checkbox"
                          checked={selectedCoachIds.includes(c.id)}
                          onChange={(e) => setSelectedCoachIds(e.target.checked
                            ? [...selectedCoachIds, c.id]
                            : selectedCoachIds.filter((id) => id !== c.id)
                          )}
                          className="w-4 h-4 accent-violet-600"
                        />
                        <span className="text-sm text-gray-800">{c.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <select value={formData.coach_id} onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition">
                    <option value="">Unassigned</option>
                    {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity</label>
                  <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                    placeholder="25" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enrolled</label>
                  <input type="number" value={formData.enrolled} onChange={(e) => setFormData({ ...formData, enrolled: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                    placeholder="0" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition resize-none"
                  rows={3} placeholder="Any extra details..." />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditingBlockId(null) }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSaveBlock} disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white py-2.5 rounded-2xl font-semibold text-sm shadow-sm transition">
                {saving ? "Saving..." : "Save Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import ScheduleBlock from "@/components/ScheduleBlock"
import BlockDetailPanel from "@/components/BlockDetailPanel"
import { createClient } from "@/lib/supabase/client"

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

const LOCATIONS = ["Big Gym", "Little Gym", "Party Room", "Preschool Room", "Classrooms"]

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
]

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
  // t is "HH:MM" 24hr from <input type="time">
  const [h, m] = t.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${period}`
}

function slotHour(slot: string) {
  // "9:00 AM" → "09", "12:00 PM" → "12"
  const [time, period] = slot.split(" ")
  let h = parseInt(time.split(":")[0])
  if (period === "PM" && h !== 12) h += 12
  if (period === "AM" && h === 12) h = 0
  return String(h).padStart(2, "0")
}

function rowToItem(row: Record<string, unknown>): ScheduleItem {
  const startTime = row.start_time as string
  const endTime = row.end_time as string
  const startDisplay = formatTimeDisplay(startTime)
  const endDisplay = formatTimeDisplay(endTime)
  return {
    id: row.id as string,
    title: row.title as string,
    type: row.type as ScheduleItem["type"],
    time: `${startDisplay} - ${endDisplay}`,
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

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

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

    // Sync team coaches
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
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Master Schedule</h2>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-1 py-1 shadow-sm">
              <button onClick={() => setCurrentDate(offsetDate(currentDate, -1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">‹</button>
              <span className="text-sm font-medium text-gray-700 px-2 min-w-[200px] text-center">{formatDate(currentDate)}</span>
              <button onClick={() => setCurrentDate(offsetDate(currentDate, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">›</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 bg-white rounded-xl px-4 py-2 hover:bg-gray-50 transition shadow-sm">⚙ Filters</button>
            <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 bg-white rounded-xl px-4 py-2 hover:bg-gray-50 transition shadow-sm">⧉ Copy Schedule</button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
              + Add Block
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-8 pb-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classes, staff, or rooms..."
              className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition shadow-sm"
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-5 gap-4 px-8 pb-6">
          {[
            { label: "Blocks Today", value: blocksToday, color: "bg-blue-100" },
            { label: "Staff Assigned", value: staffAssigned, color: "bg-violet-100" },
            { label: "Enrollment / Capacity", value: `${totalEnrolled}/${totalCapacity || "—"}`, color: "bg-green-100" },
            { label: "Zone Conflicts", value: 0, color: "bg-orange-100" },
            { label: "Staffing Gaps", value: 0, color: "bg-pink-100" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs mb-2">{card.label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
              </div>
              <div className={`w-8 h-8 rounded-lg ${card.color}`} />
            </div>
          ))}
        </div>

        {/* Schedule Grid */}
        <div className="flex-1 px-8 pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto">
            <div className="grid border-b bg-gray-50 min-w-[900px]" style={{ gridTemplateColumns: `120px repeat(${LOCATIONS.length}, 1fr)` }}>
              <div className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide border-r">Time</div>
              {LOCATIONS.map((loc) => (
                <div key={loc} className="p-4 text-sm font-semibold text-gray-700 border-r last:border-r-0">{loc}</div>
              ))}
            </div>

            <div className="min-w-[900px]">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading schedule...</div>
              ) : (
                TIME_SLOTS.map((time) => (
                  <div key={time} className="grid border-b last:border-b-0 min-h-[100px]" style={{ gridTemplateColumns: `120px repeat(${LOCATIONS.length}, 1fr)` }}>
                    <div className="p-3 border-r text-xs text-gray-400 pt-3">{time}</div>
                    {LOCATIONS.map((loc) => {
                      const cellItems = filteredItems.filter(
                        (item) => item.location === loc && item.startHour === slotHour(time)
                      )
                      return (
                        <div key={loc} className="border-r last:border-r-0 p-1.5">
                          {cellItems.length === 0 ? null : (
                            <div
                              className="flex gap-1 h-full"
                              style={{ minHeight: "74px" }}
                            >
                              {cellItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex-1 min-w-0"
                                  style={{ minWidth: 0 }}
                                >
                                  <ScheduleBlock
                                    title={item.title}
                                    time={item.time}
                                    staff={item.staff}
                                    capacity={item.capacity}
                                    type={item.type}
                                    onClick={() => setSelectedBlock(item)}
                                    compact={cellItems.length > 1}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-[540px] p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{editingBlockId ? "Edit Schedule Block" : "Add Schedule Block"}</h2>
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

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditingBlockId(null) }} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-2xl transition font-medium">Cancel</button>
              <button onClick={handleSaveBlock} disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-2xl font-semibold text-sm shadow-sm hover:shadow-md transition">
                {saving ? "Saving..." : "Save Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

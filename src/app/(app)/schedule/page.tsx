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
  capacity: string
  enrolled: number
  type: "camp" | "class" | "team" | "party" | "openGym" | "preschool" | "event"
  location: string
  startHour: string
  startTime: string
  endTime: string
  notes?: string
  date: string
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
    startHour: startTime.slice(0, 2),
    notes: (row.notes as string) ?? "",
    date: row.date as string,
  }
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<ScheduleItem | null>(null)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const loadBlocks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("date", toISODate(currentDate))
      .order("start_time")

    if (!error && data) {
      setScheduleItems(data.map(rowToItem))
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
    capacity: "",
    enrolled: "",
    notes: "",
  })

  async function handleSaveBlock() {
    if (!formData.title || !formData.startTime || !formData.endTime) return
    setSaving(true)

    const { error } = await supabase.from("schedule_blocks").insert({
      title: formData.title,
      type: formData.type,
      start_time: formData.startTime,
      end_time: formData.endTime,
      location: formData.location,
      staff: formData.staff || null,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      enrolled: formData.enrolled ? parseInt(formData.enrolled) : 0,
      notes: formData.notes || null,
      date: toISODate(currentDate),
    })

    if (!error) {
      setFormData({ title: "", type: "camp", startTime: "", endTime: "", location: "Big Gym", staff: "", capacity: "", enrolled: "", notes: "" })
      setShowModal(false)
      await loadBlocks()
    }
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
                  <div key={time} className="grid border-b last:border-b-0 min-h-[90px]" style={{ gridTemplateColumns: `120px repeat(${LOCATIONS.length}, 1fr)` }}>
                    <div className="p-3 border-r text-xs text-gray-400 pt-3">{time}</div>
                    {LOCATIONS.map((loc) => (
                      <div key={loc} className="border-r last:border-r-0 p-2 space-y-1">
                        {filteredItems
                          .filter((item) => item.location === loc && item.startHour === slotHour(time))
                          .map((item) => (
                            <ScheduleBlock
                              key={item.id}
                              title={item.title}
                              time={item.time}
                              staff={item.staff}
                              capacity={item.capacity}
                              type={item.type}
                              onClick={() => setSelectedBlock(item)}
                            />
                          ))}
                      </div>
                    ))}
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
        />
      )}

      {/* Add Block Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-[540px] p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Add Schedule Block</h2>
                <p className="text-sm text-gray-500 mt-1">Create a new class, camp, event, or activity.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition">✕</button>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Staff</label>
                <input value={formData.staff} onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                  placeholder="Coach Emily" />
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
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-2xl transition font-medium">Cancel</button>
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

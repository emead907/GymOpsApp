"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

type Shift = {
  id: string
  title: string
  type: string
  date: string
  start_time: string
  end_time: string
  location: string
  rate: number
  total_spots: number
  claims: { user_id: string; name: string }[]
  coverage_requests: { id: string; requester_id: string; requester_name: string }[]
}

type Tab = "shifts" | "coverage"

const SHIFT_TYPES = ["camp", "class", "team", "party", "preschool", "event", "openGym"]
const LOCATIONS = ["Big Gym", "Little Gym", "Party Room", "Preschool Room", "Classrooms", "Main Gym", "Ninja Zone"]

const typeColors: Record<string, string> = {
  camp: "bg-orange-100 text-orange-700",
  class: "bg-violet-100 text-violet-700",
  party: "bg-pink-100 text-pink-700",
  openGym: "bg-blue-100 text-blue-700",
  event: "bg-green-100 text-green-700",
  preschool: "bg-yellow-100 text-yellow-700",
  team: "bg-teal-100 text-teal-700",
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${period}`
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  })
}

const emptyForm = {
  title: "",
  type: "camp",
  date: "",
  start_time: "",
  end_time: "",
  location: "Main Gym",
  rate: "20",
  total_spots: "1",
}

export default function ShiftManagementPage() {
  const [tab, setTab] = useState<Tab>("shifts")
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const supabase = createClient()

  const loadShifts = useCallback(async () => {
    setLoading(true)

    const [{ data: shiftsData }, { data: claimsData }, { data: coverageData }, { data: profilesData }] = await Promise.all([
      supabase.from("shifts").select("*").order("date").order("start_time"),
      supabase.from("shift_claims").select("shift_id, user_id"),
      supabase.from("coverage_requests").select("id, shift_id, requester_id").eq("status", "open"),
      supabase.from("profiles").select("id, full_name"),
    ])

    const nameMap = new Map(
      (profilesData ?? []).map((p) => [p.id, p.full_name?.trim() || null])
    )

    const claimsByShift = new Map<string, { user_id: string; name: string }[]>()
    ;(claimsData ?? []).forEach((c) => {
      if (!claimsByShift.has(c.shift_id)) claimsByShift.set(c.shift_id, [])
      claimsByShift.get(c.shift_id)!.push({ user_id: c.user_id, name: nameMap.get(c.user_id) ?? c.user_id })
    })

    const coverageByShift = new Map<string, { id: string; requester_id: string; requester_name: string }[]>()
    ;(coverageData ?? []).forEach((r) => {
      if (!coverageByShift.has(r.shift_id)) coverageByShift.set(r.shift_id, [])
      coverageByShift.get(r.shift_id)!.push({
        id: r.id,
        requester_id: r.requester_id,
        requester_name: nameMap.get(r.requester_id) ?? r.requester_id,
      })
    })

    setShifts(
      (shiftsData ?? []).map((s) => ({
        ...s,
        claims: claimsByShift.get(s.id) ?? [],
        coverage_requests: coverageByShift.get(s.id) ?? [],
      }))
    )
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadShifts() }, [loadShifts])

  function openEdit(shift: Shift) {
    setEditingId(shift.id)
    setFormData({
      title: shift.title,
      type: shift.type,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      location: shift.location,
      rate: String(shift.rate),
      total_spots: String(shift.total_spots),
    })
    setShowModal(true)
  }

  function openCreate() {
    setEditingId(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  async function handleSaveShift() {
    if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) return
    setSaving(true)

    const payload = {
      title: formData.title,
      type: formData.type,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
      rate: parseFloat(formData.rate),
      total_spots: parseInt(formData.total_spots),
    }

    if (editingId) {
      await supabase.from("shifts").update(payload).eq("id", editingId)
    } else {
      await supabase.from("shifts").insert(payload)
    }

    setFormData(emptyForm)
    setEditingId(null)
    setShowModal(false)
    await loadShifts()
    setSaving(false)
  }

  async function handleDeleteShift(shiftId: string) {
    if (!confirm("Delete this shift? All claims and coverage requests will be removed.")) return
    setActionId(shiftId)
    await supabase.from("shifts").delete().eq("id", shiftId)
    await loadShifts()
    setActionId(null)
  }

  async function handleDropClaimant(shiftId: string, userId: string) {
    setActionId(shiftId + userId)
    // also cancel any coverage request they made
    await supabase.from("coverage_requests").delete().eq("shift_id", shiftId).eq("requester_id", userId)
    await supabase.from("shift_claims").delete().eq("shift_id", shiftId).eq("user_id", userId)
    await loadShifts()
    setActionId(null)
  }

  async function handleApproveDrop(shiftId: string, coverageId: string, requesterId: string) {
    setActionId(coverageId)
    // admin approves: just remove the claim and the coverage request
    await supabase.from("coverage_requests").delete().eq("id", coverageId)
    await supabase.from("shift_claims").delete().eq("shift_id", shiftId).eq("user_id", requesterId)
    await loadShifts()
    setActionId(null)
  }

  async function handleDenyCoverage(coverageId: string) {
    setActionId(coverageId)
    await supabase.from("coverage_requests").delete().eq("id", coverageId)
    await loadShifts()
    setActionId(null)
  }

  const openCoverageRequests = shifts.flatMap((s) =>
    s.coverage_requests.map((r) => ({ ...r, shift: s }))
  )

  const totalShifts = shifts.length
  const filledShifts = shifts.filter((s) => s.claims.length >= s.total_spots).length
  const openRequests = openCoverageRequests.length
  const unclaimedShifts = shifts.filter((s) => s.claims.length === 0).length

  return (
    <div className="p-8 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
          <p className="text-gray-500 text-sm mt-1">Create shifts, manage claims, and handle coverage requests</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          + Create Shift
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Shifts", value: totalShifts, color: "bg-violet-100" },
          { label: "Fully Staffed", value: filledShifts, color: "bg-green-100" },
          { label: "Unclaimed", value: unclaimedShifts, color: "bg-orange-100" },
          { label: "Coverage Requests", value: openRequests, color: openRequests > 0 ? "bg-red-100" : "bg-gray-100", highlight: openRequests > 0 },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-2">{card.label}</p>
              <h3 className={`text-2xl font-bold ${card.highlight ? "text-red-500" : "text-gray-900"}`}>{card.value}</h3>
            </div>
            <div className={`w-8 h-8 rounded-lg ${card.color}`} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("shifts")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition ${tab === "shifts" ? "bg-violet-100 text-violet-700" : "text-gray-500 hover:bg-gray-100"}`}
        >
          All Shifts
        </button>
        <button
          onClick={() => setTab("coverage")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${tab === "coverage" ? "bg-violet-100 text-violet-700" : "text-gray-500 hover:bg-gray-100"}`}
        >
          Coverage Requests
          {openRequests > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{openRequests}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
      ) : tab === "shifts" ? (

        /* Shifts Table */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shift</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date & Time</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shifts.map((shift) => {
                const filled = shift.claims.length >= shift.total_spots
                const empty = shift.claims.length === 0
                return (
                  <tr key={shift.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[shift.type] ?? "bg-gray-100 text-gray-600"}`}>
                          {shift.type}
                        </span>
                        <span className="font-semibold text-gray-900">{shift.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{formatDate(shift.date)}</p>
                      <p className="text-xs text-gray-400">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{shift.location}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${filled ? "bg-green-100 text-green-700" : empty ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700"}`}>
                          {shift.claims.length}/{shift.total_spots}
                        </span>
                        {shift.claims.length > 0 && (
                          <div className="flex flex-col gap-0.5">
                            {shift.claims.map((c) => (
                              <div key={c.user_id} className="flex items-center gap-1.5">
                                <span className="text-gray-700 text-xs">{c.name}</span>
                                {shift.coverage_requests.some((r) => r.requester_id === c.user_id) && (
                                  <span className="text-xs text-amber-600 font-medium">(needs cover)</span>
                                )}
                                <button
                                  onClick={() => handleDropClaimant(shift.id, c.user_id)}
                                  disabled={actionId === shift.id + c.user_id}
                                  className="text-red-400 hover:text-red-600 text-xs transition disabled:opacity-50"
                                  title="Drop this coach from shift"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">${shift.rate}/hr</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(shift)}
                          className="text-xs text-violet-600 hover:text-violet-800 font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          disabled={actionId === shift.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">No shifts yet. Create one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      ) : (

        /* Coverage Requests */
        <div className="space-y-4">
          {openCoverageRequests.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No open coverage requests.</div>
          ) : (
            openCoverageRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-amber-500 text-lg">⚠️</span>
                      <div>
                        <p className="font-bold text-gray-900">{req.shift.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(req.shift.date)} · {formatTime(req.shift.start_time)} – {formatTime(req.shift.end_time)} · {req.shift.location}
                        </p>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800">
                      <span className="font-semibold">{req.requester_name}</span> has requested coverage for this shift.
                      They remain responsible until coverage is confirmed or an admin approves the drop.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleApproveDrop(req.shift.id, req.id, req.requester_id)}
                    disabled={actionId === req.id}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  >
                    {actionId === req.id ? "..." : "Approve Drop"}
                  </button>
                  <button
                    onClick={() => handleDenyCoverage(req.id)}
                    disabled={actionId === req.id}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  >
                    Deny Request
                  </button>
                  <p className="text-xs text-gray-400 self-center ml-2">
                    Approving drop removes them from the shift. Denying cancels their request — they stay assigned.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-[520px] p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{editingId ? "Edit Shift" : "Create Shift"}</h2>
                <p className="text-sm text-gray-500 mt-1">{editingId ? "Update the details for this shift." : "Add a new shift for coaches to claim."}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                  placeholder="Summer Camp"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                  >
                    {SHIFT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                >
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pay Rate ($/hr)</label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Spots Needed</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_spots}
                    onChange={(e) => setFormData({ ...formData, total_spots: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 transition"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-2xl transition font-medium">Cancel</button>
              <button
                onClick={handleSaveShift}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-2xl font-semibold text-sm shadow-sm transition"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Shift"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

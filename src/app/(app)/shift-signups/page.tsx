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
  claimed_spots: number
  i_claimed: boolean
  claim_id?: string
  needs_coverage: boolean
  coverage_request_id?: string
  coverage_requester_id?: string
}

type Tab = "all" | "available" | "mine"

type RecurringShift = {
  id: string
  title: string
  type: string
  day_of_week: number
  start_time: string
  end_time: string
  location: string
  needs_coverage: boolean
  coverage_request_id?: string
  coverage_date?: string
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const typeColors: Record<string, string> = {
  camp: "bg-orange-400 text-white",
  class: "bg-violet-500 text-white",
  party: "bg-pink-400 text-white",
  openGym: "bg-blue-400 text-white",
  event: "bg-green-400 text-white",
  preschool: "bg-yellow-400 text-white",
  team: "bg-teal-400 text-white",
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${period}`
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })
}

function duration(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} hr ${m} min` : `${h} hour${h !== 1 ? "s" : ""}`
}

function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// Groups recurring shifts on the same day_of_week where the gap between
// end_time of one shift and start_time of the next is ≤ 15 minutes.
// Only "class" type shifts are eligible for merging. Tracks per-day so
// interleaved shifts from other coaches don't break the chain.
function groupConsecutive(shifts: RecurringShift[]): RecurringShift[][] {
  const sorted = [...shifts].sort((a, b) =>
    a.day_of_week !== b.day_of_week
      ? a.day_of_week - b.day_of_week
      : timeToMins(a.start_time) - timeToMins(b.start_time)
  )
  const groups: RecurringShift[][] = []
  // For the coach view all shifts belong to the same coach, so key by day only
  const lastGroupByDay = new Map<number, number>()

  for (const shift of sorted) {
    const mergeable = shift.type === "class" || shift.type === "team"
    const lastIdx = mergeable ? lastGroupByDay.get(shift.day_of_week) : undefined

    if (lastIdx !== undefined) {
      const lastGroup = groups[lastIdx]
      const prev = lastGroup[lastGroup.length - 1]
      const gap = timeToMins(shift.start_time) - timeToMins(prev.end_time)
      const isConsecutiveClass = shift.type === "class" && prev.type === "class" && gap <= 15
      const isOverlappingTeam = shift.type === "team" && prev.type === "team" && gap < 0
      if (isConsecutiveClass || isOverlappingTeam) {
        lastGroup.push(shift)
        continue
      }
    }

    groups.push([shift])
    if (mergeable) {
      lastGroupByDay.set(shift.day_of_week, groups.length - 1)
    }
  }

  return groups
}

export default function ShiftSignupsPage() {
  const [tab, setTab] = useState<Tab>("all")
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [myRecurring, setMyRecurring] = useState<RecurringShift[]>([])
  const [availableCoverage, setAvailableCoverage] = useState<RecurringShift[]>([])

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadShifts = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const [{ data: shiftsData }, { data: claimsData }, { data: allClaims }, { data: coverageData }] = await Promise.all([
      supabase.from("shifts").select("*").order("date").order("start_time"),
      supabase.from("shift_claims").select("id, shift_id").eq("user_id", userId),
      supabase.from("shift_claims").select("shift_id"),
      supabase.from("coverage_requests").select("id, shift_id, requester_id, status").eq("status", "open"),
    ])

    const claimedByMe = new Map((claimsData ?? []).map((c) => [c.shift_id, c.id]))
    const spotsTaken = new Map<string, number>()
    ;(allClaims ?? []).forEach((c) => {
      spotsTaken.set(c.shift_id, (spotsTaken.get(c.shift_id) ?? 0) + 1)
    })
    const coverageMap = new Map(
      (coverageData ?? []).map((r) => [r.shift_id, { id: r.id, requester_id: r.requester_id }])
    )

    setShifts(
      (shiftsData ?? []).map((s) => {
        const coverage = coverageMap.get(s.id)
        return {
          ...s,
          claimed_spots: spotsTaken.get(s.id) ?? 0,
          i_claimed: claimedByMe.has(s.id),
          claim_id: claimedByMe.get(s.id),
          needs_coverage: !!coverage,
          coverage_request_id: coverage?.id,
          coverage_requester_id: coverage?.requester_id,
        }
      })
    )
    // Load recurring shifts assigned to me + open coverage requests
    const [{ data: myRecurringData }, { data: openCoverageData }] = await Promise.all([
      supabase.from("recurring_shifts").select("*").eq("assigned_coach_id", userId).eq("active", true),
      supabase.from("recurring_coverage_requests").select("*, recurring_shifts(*)").eq("status", "open").neq("requester_id", userId),
    ])

    setMyRecurring(
      (myRecurringData ?? []).map((r) => {
        const coverageReq = (openCoverageData ?? []).find((c) => c.recurring_shift_id === r.id)
        return {
          ...r,
          needs_coverage: !!coverageReq,
          coverage_request_id: coverageReq?.id,
          coverage_date: coverageReq?.shift_date,
        }
      })
    )

    setAvailableCoverage(
      (openCoverageData ?? [])
        .filter((c) => c.recurring_shifts?.assigned_coach_id !== userId)
        .map((c) => ({
          ...c.recurring_shifts,
          needs_coverage: true,
          coverage_request_id: c.id,
          coverage_date: c.shift_date,
        }))
    )

    setLoading(false)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userId) loadShifts()
  }, [userId, loadShifts])

  async function claimShift(shiftId: string) {
    if (!userId) return
    setActionId(shiftId)
    await supabase.from("shift_claims").insert({ shift_id: shiftId, user_id: userId })
    await loadShifts()
    setActionId(null)
  }

  async function unclaimShift(shiftId: string, claimId: string) {
    setActionId(shiftId)
    // cancel any open coverage request first
    await supabase.from("coverage_requests").delete().eq("shift_id", shiftId).eq("requester_id", userId!)
    await supabase.from("shift_claims").delete().eq("id", claimId)
    await loadShifts()
    setActionId(null)
  }

  async function requestCoverage(shiftId: string) {
    if (!userId) return
    setActionId(shiftId)
    await supabase.from("coverage_requests").insert({
      shift_id: shiftId,
      requester_id: userId,
      status: "open",
    })
    await loadShifts()
    setActionId(null)
  }

  async function cancelCoverageRequest(shiftId: string) {
    if (!userId) return
    setActionId(shiftId)
    await supabase.from("coverage_requests").delete().eq("shift_id", shiftId).eq("requester_id", userId)
    await loadShifts()
    setActionId(null)
  }

  async function requestRecurringCoverage(recurringId: string) {
    if (!userId) return
    setActionId(recurringId)
    const today = new Date().toISOString().split("T")[0]
    await supabase.from("recurring_coverage_requests").insert({
      recurring_shift_id: recurringId,
      requester_id: userId,
      shift_date: today,
      status: "open",
    })
    await loadShifts()
    setActionId(null)
  }

  async function cancelRecurringCoverage(coverageId: string) {
    setActionId(coverageId)
    await supabase.from("recurring_coverage_requests").delete().eq("id", coverageId)
    await loadShifts()
    setActionId(null)
  }

  async function coverRecurringShift(coverage: RecurringShift) {
    if (!userId || !coverage.coverage_request_id) return
    setActionId(coverage.coverage_request_id)
    await supabase.from("recurring_coverage_requests").update({ status: "covered", coverer_id: userId }).eq("id", coverage.coverage_request_id)
    await loadShifts()
    setActionId(null)
  }

  async function coverShift(shift: Shift) {
    if (!userId) return
    setActionId(shift.id)

    // Add claim for the coverer
    await supabase.from("shift_claims").insert({ shift_id: shift.id, user_id: userId })

    // Mark coverage request as covered and record who covered it
    await supabase
      .from("coverage_requests")
      .update({ status: "covered", coverer_id: userId })
      .eq("id", shift.coverage_request_id!)

    // Remove the original claimer's shift claim
    await supabase
      .from("shift_claims")
      .delete()
      .eq("shift_id", shift.id)
      .eq("user_id", shift.coverage_requester_id!)

    await loadShifts()
    setActionId(null)
  }

  const displayed = shifts.filter((s) => {
    if (tab === "available") return (!s.i_claimed && s.claimed_spots < s.total_spots) || (s.needs_coverage && !s.i_claimed)
    if (tab === "mine") return s.i_claimed
    return true
  })

  const myShifts = shifts.filter((s) => s.i_claimed)
  const hoursThisWeek = myShifts.reduce((sum, s) => {
    const [sh, sm] = s.start_time.split(":").map(Number)
    const [eh, em] = s.end_time.split(":").map(Number)
    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60
  }, 0)
  const claimedCount = myShifts.length
  const availableCount = shifts.filter((s) => !s.i_claimed && (s.claimed_spots < s.total_spots || s.needs_coverage)).length

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 overflow-y-auto">

        <h2 className="text-2xl font-bold text-gray-900">Shift Signup</h2>
        <p className="text-gray-500 text-sm mt-1 mb-6">Claim available shifts and manage your schedule</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "available", "mine"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${tab === t ? "bg-violet-100 text-violet-700" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {t === "all" ? "All Shifts" : t === "available" ? "Available" : "My Shifts"}
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-violet-500 to-pink-500 flex flex-col">
            <span className="text-4xl font-bold">{hoursThisWeek.toFixed(1)}</span>
            <span className="text-white/80 text-sm mt-1">Hours This Week</span>
          </div>
          <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-blue-400 to-cyan-400 flex flex-col">
            <span className="text-4xl font-bold">{claimedCount}</span>
            <span className="text-white/80 text-sm mt-1">Shifts Claimed</span>
          </div>
          <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-green-400 to-emerald-500 flex flex-col">
            <span className="text-4xl font-bold">{availableCount}</span>
            <span className="text-white/80 text-sm mt-1">Available Shifts</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {tab === "all" ? "All Shifts" : tab === "available" ? "Available Shifts" : "My Shifts"}
        </h3>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading shifts...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayed.map((shift) => {
              const spotsLeft = shift.total_spots - shift.claimed_spots
              const isMine = shift.i_claimed
              const iRequested = isMine && shift.needs_coverage && shift.coverage_requester_id === userId
              const someoneElseRequested = shift.needs_coverage && shift.coverage_requester_id !== userId
              const full = spotsLeft <= 0 && !isMine && !someoneElseRequested
              const busy = actionId === shift.id

              return (
                <div
                  key={shift.id}
                  className={`bg-white rounded-2xl border-2 p-5 shadow-sm flex flex-col gap-3 transition ${
                    isMine && iRequested
                      ? "border-amber-300"
                      : isMine
                      ? "border-green-300"
                      : someoneElseRequested
                      ? "border-blue-300"
                      : full
                      ? "border-gray-100 opacity-60"
                      : "border-gray-100"
                  }`}
                >
                  {/* Coverage needed banner */}
                  {someoneElseRequested && !isMine && (
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl px-3 py-2 text-xs font-semibold">
                      <span>🔄</span> Coverage Needed — someone needs a sub for this shift
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeColors[shift.type] ?? "bg-gray-200 text-gray-700"}`}>
                      {shift.title}
                    </span>
                    <span className="text-violet-600 font-bold text-base">${shift.rate}/hr</span>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><span>📅</span> {formatDate(shift.date)}</div>
                    <div className="flex items-center gap-2">
                      <span>🕐</span> {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                      <span className="text-gray-400 text-xs">({duration(shift.start_time, shift.end_time)})</span>
                    </div>
                    <div className="flex items-center gap-2"><span>📍</span> {shift.location}</div>
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span className={spotsLeft === 0 && !isMine ? "text-red-500 font-medium" : ""}>
                        {spotsLeft} of {shift.total_spots} spots available
                      </span>
                    </div>
                  </div>

                  {/* My shift — coverage requested by me */}
                  {isMine && iRequested && (
                    <div className="space-y-2">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                        <p className="font-semibold mb-1">⚠️ Coverage Requested</p>
                        <p>This shift is still your responsibility until another coach agrees to cover it. Please show up unless you receive confirmation.</p>
                      </div>
                      <button
                        onClick={() => cancelCoverageRequest(shift.id)}
                        disabled={busy}
                        className="w-full border border-amber-300 text-amber-700 hover:bg-amber-50 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      >
                        {busy ? "Cancelling..." : "Cancel Coverage Request"}
                      </button>
                    </div>
                  )}

                  {/* My shift — no coverage requested yet */}
                  {isMine && !iRequested && (
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-4 py-2.5 text-sm font-semibold">
                        <span>✓</span> Claimed
                      </div>
                      <button
                        onClick={() => requestCoverage(shift.id)}
                        disabled={busy}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {busy ? "..." : "Need Cover?"}
                      </button>
                    </div>
                  )}

                  {/* Not mine — someone needs coverage */}
                  {!isMine && someoneElseRequested && (
                    <button
                      onClick={() => coverShift(shift)}
                      disabled={busy}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      {busy ? "Covering..." : "Cover This Shift"}
                    </button>
                  )}

                  {/* Not mine — normal open spot */}
                  {!isMine && !someoneElseRequested && (
                    full ? (
                      <div className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl text-sm font-semibold text-center">Full</div>
                    ) : (
                      <button
                        onClick={() => claimShift(shift.id)}
                        disabled={busy}
                        className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                      >
                        {busy ? "Claiming..." : "Claim Shift"}
                      </button>
                    )
                  )}
                </div>
              )
            })}

            {displayed.length === 0 && myRecurring.length === 0 && tab === "mine" && (
              <div className="col-span-2 text-center py-10 text-gray-400">
                You haven't claimed any shifts yet.
              </div>
            )}
            {displayed.length === 0 && tab !== "mine" && availableCoverage.length === 0 && (
              <div className="col-span-2 text-center py-10 text-gray-400">
                No shifts to show.
              </div>
            )}
          </div>
        )}

        {/* Recurring shifts — My Shifts tab, grouped by day with consecutive merging */}
        {!loading && tab === "mine" && myRecurring.length > 0 && (
          <div className="mt-6">
            <h4 className="text-base font-bold text-gray-900 mb-3">My Weekly Classes</h4>
            <div className="grid grid-cols-2 gap-4">
              {groupConsecutive(myRecurring).map((group) => {
                const r = group[0]
                const lastR = group[group.length - 1]
                const isMerged = group.length > 1
                const shiftStart = formatTime(r.start_time)
                const shiftEnd = formatTime(lastR.end_time)
                const iRequested = group.some((s) => s.needs_coverage)
                const busy = actionId === r.id || actionId === r.coverage_request_id
                return (
                  <div key={r.id} className={`bg-white rounded-2xl border-2 p-5 shadow-sm flex flex-col gap-3 ${iRequested ? "border-amber-300" : "border-violet-200"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        {group.map((s) => (
                          <span key={s.id} className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mr-1 mb-1 ${typeColors[s.type] ?? "bg-gray-200 text-gray-700"}`}>{s.title}</span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 font-medium shrink-0 ml-1">Weekly</span>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><span>📅</span> Every {DAYS[r.day_of_week]}</div>
                      <div className="flex items-center gap-2">
                        <span>🕐</span> {shiftStart} – {shiftEnd}
                        {isMerged && <span className="text-xs text-violet-500 font-medium">({group.length} classes)</span>}
                      </div>
                      <div className="flex items-center gap-2"><span>📍</span> {r.location}</div>
                    </div>
                    {iRequested ? (
                      <div className="space-y-2">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                          <p className="font-semibold mb-1">⚠️ Coverage Requested</p>
                          <p>You are still responsible until another coach covers this class.</p>
                        </div>
                        <button
                          onClick={() => cancelRecurringCoverage(r.coverage_request_id!)}
                          disabled={busy}
                          className="w-full border border-amber-300 text-amber-700 hover:bg-amber-50 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                        >
                          {busy ? "Cancelling..." : "Cancel Request"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-violet-50 text-violet-700 rounded-xl px-4 py-2.5 text-sm font-semibold justify-between">
                        <span>✓ Assigned</span>
                        <button
                          onClick={() => requestRecurringCoverage(r.id)}
                          disabled={busy}
                          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 bg-white px-2 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {busy ? "..." : "Need Cover?"}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recurring coverage needed — Available tab */}
        {!loading && (tab === "all" || tab === "available") && availableCoverage.length > 0 && (
          <div className="mt-6">
            <h4 className="text-base font-bold text-gray-900 mb-3">Coverage Needed — Weekly Classes</h4>
            <div className="grid grid-cols-2 gap-4">
              {availableCoverage.map((r) => {
                const busy = actionId === r.coverage_request_id
                return (
                  <div key={r.coverage_request_id} className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl px-3 py-2 text-xs font-semibold">
                      <span>🔄</span> Coverage Needed
                    </div>
                    <div className="flex items-start justify-between">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeColors[r.type] ?? "bg-gray-200 text-gray-700"}`}>{r.title}</span>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><span>📅</span> Every {DAYS[r.day_of_week]}</div>
                      <div className="flex items-center gap-2"><span>🕐</span> {formatTime(r.start_time)} – {formatTime(r.end_time)}</div>
                      <div className="flex items-center gap-2"><span>📍</span> {r.location}</div>
                    </div>
                    <button
                      onClick={() => coverRecurringShift(r)}
                      disabled={busy}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      {busy ? "Covering..." : "Cover This Class"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-gray-100 bg-white p-6 overflow-y-auto shrink-0">

        {/* Profile Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 font-bold text-lg flex items-center justify-center shrink-0">JD</div>
            <div>
              <p className="font-bold text-gray-900">Jane Doe</p>
              <p className="text-sm text-gray-400">Coach</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: "Total Hours (Month)", value: "98.5 hrs", highlight: false },
              { label: "Earnings (Month)", value: "$2,183", highlight: true },
              { label: "Shifts Completed", value: "42", highlight: false },
              { label: "Rating", value: "4.9 ★", highlight: false },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-gray-500">{row.label}</span>
                <span className={`font-semibold ${row.highlight ? "text-green-600" : "text-gray-900"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-violet-500">📅</span> This Week
          </h4>
          <div className="space-y-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
              const dayShifts = myShifts.filter((s) => {
                const d = new Date(s.date + "T00:00:00")
                return d.toLocaleDateString("en-US", { weekday: "short" }) === day
              })
              const hours = dayShifts.reduce((sum, s) => {
                const [sh, sm] = s.start_time.split(":").map(Number)
                const [eh, em] = s.end_time.split(":").map(Number)
                return sum + (eh * 60 + em - (sh * 60 + sm)) / 60
              }, 0)
              return (
                <div key={day} className={`flex justify-between items-center px-3 py-2 rounded-xl text-sm ${hours > 0 ? "bg-violet-50" : "bg-gray-50"}`}>
                  <span className={`font-medium ${hours > 0 ? "text-violet-700" : "text-gray-600"}`}>{day}</span>
                  <span className={`text-sm ${hours > 0 ? "text-violet-600 font-semibold" : "text-gray-400"}`}>
                    {hours > 0 ? `${hours % 1 === 0 ? hours : hours.toFixed(1)} hrs` : "No shifts"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-violet-500">🔔</span> Notifications
          </h4>
          <div className="space-y-3">
            {myShifts.filter((s) => s.needs_coverage && s.coverage_requester_id === userId).map((s) => (
              <div key={s.id} className="border border-amber-200 bg-amber-50 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-800 font-medium">Coverage pending for {s.title}</p>
                <p className="text-xs text-amber-500 mt-1">You are still responsible until covered</p>
              </div>
            ))}
            {myShifts.filter((s) => !s.needs_coverage).slice(0, 2).map((s) => (
              <div key={s.id} className="border border-green-200 bg-green-50 rounded-xl px-4 py-3">
                <p className="text-sm text-green-800 font-medium">Your shift for {s.title} on {formatDate(s.date)} has been confirmed</p>
                <p className="text-xs text-green-500 mt-1">Just now</p>
              </div>
            ))}
            <div className="border border-blue-100 bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-sm text-blue-800 font-medium">New shifts available for next week</p>
              <p className="text-xs text-blue-400 mt-1">1 day ago</p>
            </div>
            {myShifts.length === 0 && (
              <p className="text-sm text-gray-400">No notifications.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

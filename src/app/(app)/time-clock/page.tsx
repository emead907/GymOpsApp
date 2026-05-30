"use client"

import { useState, useEffect } from "react"

type ClockState = "idle" | "clocked-in"

export default function TimeClockPage() {
  const [clockState, setClockState] = useState<ClockState>("idle")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [clockInTime, setClockInTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (clockState !== "clocked-in" || !clockInTime) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - clockInTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [clockState, clockInTime])

  function formatTime(date: Date) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  function formatElapsed(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const shiftStart = new Date()
  shiftStart.setHours(9, 0, 0, 0)
  const shiftEnd = new Date()
  shiftEnd.setHours(12, 0, 0, 0)
  const earliestClock = new Date(shiftStart.getTime() - 15 * 60000)
  const latestClock = new Date(shiftStart.getTime() + 15 * 60000)
  const minsUntilShift = Math.max(0, Math.round((shiftStart.getTime() - currentTime.getTime()) / 60000))

  function handleClockIn() {
    setClockInTime(new Date())
    setClockState("clocked-in")
  }

  function handleClockOut() {
    setClockState("idle")
    setClockInTime(null)
    setElapsed(0)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Time Clock</h2>
            <p className="text-gray-500 text-sm mt-1">Clock in and out for your scheduled shifts</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm text-sm text-gray-700">
            <span>🕐</span>
            <span className="font-semibold">Current Time</span>
            <span className="text-violet-600 font-bold">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Next Shift */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-lg">📅</div>
            <p className="text-sm text-gray-500 font-medium">Your Next Shift</p>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3">Summer Camp - Morning Session</h3>
          <div className="flex items-center gap-5 text-sm text-gray-500">
            <span>📍 Main Gym</span>
            <span>🕐 9:00 AM - 12:00 PM</span>
          </div>
          {clockState === "idle" && (
            <div className="mt-4 bg-violet-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-700 text-sm font-medium">
                <span>⏰</span> Shift starts in {minsUntilShift} minutes
              </div>
              <span className="text-violet-700 font-bold text-lg">{minsUntilShift} minutes</span>
            </div>
          )}
          {clockState === "clocked-in" && (
            <div className="mt-4 bg-green-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <span>✓</span> Clocked in at {clockInTime ? formatTime(clockInTime) : "—"}
              </div>
              <span className="text-green-700 font-bold text-lg">{formatElapsed(elapsed)}</span>
            </div>
          )}
        </div>

        {/* Clock Window */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
            <span>ℹ</span> Schedule Window
          </div>
          <p className="text-sm text-blue-600 mb-4">
            You may clock in within a 15-minute window before or after your scheduled start time.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Earliest Clock-In</p>
              <p className="text-lg font-bold text-green-600">{formatTime(earliestClock)}</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Latest Clock-In</p>
              <p className="text-lg font-bold text-red-500">{formatTime(latestClock)}</p>
            </div>
          </div>
        </div>

        {/* Clock In/Out */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-5">
          <div
            onClick={clockState === "idle" ? handleClockIn : handleClockOut}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white mx-auto mb-4 cursor-pointer transition hover:scale-105 shadow-lg ${clockState === "idle" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
          >
            {clockState === "idle" ? "→" : "■"}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {clockState === "idle" ? "Ready to Clock In?" : "Currently Clocked In"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {clockState === "idle" ? "Start tracking your time for this shift" : "Click to end your shift"}
          </p>
          <button
            onClick={clockState === "idle" ? handleClockIn : handleClockOut}
            className={`px-10 py-3 rounded-2xl font-semibold text-white transition shadow-sm ${clockState === "idle" ? "bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90" : "bg-red-500 hover:bg-red-600"}`}
          >
            {clockState === "idle" ? "Start Clock In" : "Clock Out"}
          </button>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-violet-500">ℹ</span> Schedule Window Rules
          </h4>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mt-0.5 shrink-0">✓</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">On-Time Clock-In</p>
                <p className="text-gray-500 text-xs mt-0.5">Clocking in within 15 minutes before or after your scheduled start time is considered on-time. No notifications are sent.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs mt-0.5 shrink-0">!</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Early Clock-In</p>
                <p className="text-gray-500 text-xs mt-0.5">Clocking in more than 15 minutes early will notify your manager. You may still proceed if this was arranged in advance.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs mt-0.5 shrink-0">!</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Late Clock-In</p>
                <p className="text-gray-500 text-xs mt-0.5">Clocking in more than 15 minutes late will notify your manager. Please include notes explaining the reason.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Sidebar */}
      <div className="w-72 border-l border-gray-100 bg-white p-6 overflow-y-auto">

        <h4 className="font-bold text-gray-900 mb-4">Clock-In Scenarios</h4>
        <div className="space-y-4 mb-8">
          {[
            { label: "On Time", desc: "Within scheduled window", color: "text-green-600 bg-green-50 border-green-200", status: "No notification", statusColor: "text-green-600" },
            { label: "Early", desc: "More than 15 minutes early", color: "text-orange-500 bg-orange-50 border-orange-200", status: "Admin notified", statusColor: "text-orange-500" },
            { label: "Late", desc: "More than 15 minutes late", color: "text-red-500 bg-red-50 border-red-200", status: "Admin notified", statusColor: "text-red-500" },
          ].map((scenario) => (
            <div key={scenario.label} className={`rounded-xl border p-3 ${scenario.color}`}>
              <p className="font-semibold text-sm">{scenario.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{scenario.desc}</p>
              <p className={`text-xs font-semibold mt-2 ${scenario.statusColor}`}>{scenario.status}</p>
            </div>
          ))}
        </div>

        <h4 className="font-bold text-gray-900 mb-3">Today's Activity</h4>
        <div className="space-y-2 text-sm mb-8">
          {[
            { label: "Total Hours", value: clockState === "clocked-in" ? (elapsed / 3600).toFixed(1) : "0.0" },
            { label: "Shifts Completed", value: "0" },
            { label: "Upcoming", value: "1" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-semibold text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>

        <h4 className="font-bold text-violet-600 mb-3">Quick Tips</h4>
        <ul className="space-y-2 text-xs text-violet-600">
          <li className="flex gap-2"><span>·</span> Clock in as close to your scheduled time as possible</li>
          <li className="flex gap-2"><span>·</span> Add notes if you need to clock in early or late</li>
          <li className="flex gap-2"><span>·</span> Don't forget to clock out at the end of your shift</li>
        </ul>

      </div>
    </div>
  )
}

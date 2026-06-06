"use client"

import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassType = "class" | "team" | "ninja" | "preschool" | "tumbling" | "camp"

type ClassBlock = {
  name: string
  start: string // "HH:MM" 24-hr
  end: string
  type: ClassType
  coaches?: string[]
}

type DayData = {
  little: ClassBlock[]
  big: ClassBlock[]
  camp: ClassBlock[]
}

// ─── Styling ──────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<ClassType, { bg: string; border: string; text: string; bar: string; label: string }> = {
  class:     { bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-900", bar: "bg-violet-500",  label: "Class"     },
  team:      { bg: "bg-green-50",   border: "border-green-200",  text: "text-green-900",  bar: "bg-green-500",   label: "Team"      },
  ninja:     { bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-900", bar: "bg-orange-500",  label: "Ninja"     },
  preschool: { bg: "bg-yellow-50",  border: "border-yellow-200", text: "text-yellow-900", bar: "bg-yellow-400",  label: "Preschool" },
  tumbling:  { bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-900",   bar: "bg-blue-500",    label: "Tumbling"  },
  camp:      { bg: "bg-teal-50",    border: "border-teal-200",   text: "text-teal-900",   bar: "bg-teal-500",    label: "Camp"      },
}

// ─── Schedule Data ────────────────────────────────────────────────────────────

const SCHEDULE: DayData[] = [
  // Monday
  {
    little: [
      { name: "Shining Stars", start: "16:30", end: "17:30", type: "class" },
      { name: "Shining Stars", start: "17:30", end: "18:30", type: "class" },
    ],
    big: [
      { name: "Team Bronze",       start: "09:00", end: "11:00", type: "team",  coaches: ["Amanda Griswold"] },
      { name: "Team Silver",       start: "09:00", end: "12:00", type: "team",  coaches: ["Amanda Griswold"] },
      { name: "Team Gold",         start: "09:00", end: "12:00", type: "team",  coaches: ["Emily Mead"] },
      { name: "Team Plat/Diamond", start: "09:00", end: "13:00", type: "team",  coaches: ["Emily Mead"] },
      { name: "Starz 1",           start: "16:30", end: "17:30", type: "class", coaches: ["Aliyah Allen"] },
      { name: "Starz 3",           start: "17:30", end: "18:30", type: "class", coaches: ["Aliyah Allen"] },
      { name: "Starz 2",           start: "18:30", end: "19:30", type: "class", coaches: ["Aliyah Allen"] },
    ],
    camp: [{ name: "Summer Camp", start: "08:00", end: "17:00", type: "camp" }],
  },
  // Tuesday
  {
    little: [
      { name: "Shooting Stars", start: "13:00", end: "14:00", type: "class" },
      { name: "Ninja 1",        start: "16:30", end: "17:30", type: "ninja",     coaches: ["Brynlee Cafferty"] },
      { name: "Twinkling Stars",start: "16:45", end: "17:30", type: "preschool", coaches: ["Tamsin Schoedler"] },
      { name: "Shooting Stars", start: "17:30", end: "18:30", type: "class",     coaches: ["Mckenna Alvey"] },
      { name: "Shooting Stars", start: "18:30", end: "19:30", type: "class",     coaches: ["Tamsin Schoedler"] },
    ],
    big: [
      { name: "Team Bronze",   start: "09:00", end: "11:00", type: "team",  coaches: ["Mckenna Alvey", "Amanda Griswold", "Emily Mead"] },
      { name: "Team Silver",   start: "09:00", end: "12:00", type: "team",  coaches: ["Mckenna Alvey", "Amanda Griswold", "Emily Mead"] },
      { name: "Shining Stars", start: "16:30", end: "17:30", type: "class", coaches: ["Aliyah Allen"] },
      { name: "Super Stars",   start: "17:00", end: "18:30", type: "class", coaches: ["Nikki Rainville"] },
      { name: "Pre-Team",      start: "17:00", end: "19:00", type: "team",  coaches: ["Mckenna Alvey"] },
      { name: "Shining Stars", start: "17:30", end: "18:30", type: "class", coaches: ["Aliyah Allen"] },
      { name: "Ninja 2",       start: "17:30", end: "18:30", type: "ninja", coaches: ["Brynlee Cafferty"] },
      { name: "Shining Stars", start: "18:30", end: "19:30", type: "class", coaches: ["Aliyah Allen"] },
      { name: "Ninja 3",       start: "18:30", end: "19:30", type: "ninja", coaches: ["Brynlee Cafferty", "Swayah Olney"] },
    ],
    camp: [{ name: "Summer Camp", start: "08:00", end: "17:00", type: "camp" }],
  },
  // Wednesday
  {
    little: [
      { name: "Tiny Stars",     start: "16:30", end: "17:15", type: "preschool", coaches: ["Tamsin Schoedler"] },
      { name: "Shooting Stars", start: "16:30", end: "17:30", type: "class",     coaches: ["Mckenna Alvey"] },
      { name: "Ninja 1",        start: "16:30", end: "17:30", type: "ninja",     coaches: ["Brynlee Cafferty", "Adam Santiago"] },
      { name: "Twinkling Stars",start: "17:30", end: "18:15", type: "preschool", coaches: ["Mckenna Alvey"] },
      { name: "Shooting Stars", start: "17:30", end: "18:30", type: "class",     coaches: ["Nikki Rainville"] },
      { name: "Ninja 3",        start: "18:30", end: "19:30", type: "ninja",     coaches: ["Adam Santiago", "Brynlee Cafferty"] },
    ],
    big: [
      { name: "Team Gold",         start: "09:00", end: "12:00", type: "team" ,   coaches: ["Emily Mead"] },
      { name: "Team Plat/Diamond", start: "09:00", end: "13:00", type: "team",    coaches: ["Emily Mead"] },
      { name: "Tumbling",          start: "12:00", end: "13:00", type: "tumbling" },
      { name: "Shining Stars",     start: "12:00", end: "13:00", type: "class" },
      { name: "Shining Stars",     start: "16:30", end: "17:30", type: "class",   coaches: ["Nikki Rainville"] },
      { name: "Adv Tumbling",      start: "17:30", end: "18:30", type: "tumbling",coaches: ["Adam Santiago"] },
      { name: "Shining Stars",     start: "17:30", end: "18:30", type: "class",   coaches: ["Aliyah Allen", "Nikki Rainville"] },
      { name: "Shining Stars",     start: "18:15", end: "19:15", type: "class",   coaches: ["Mckenna Alvey"] },
      { name: "Beg Tumbling",      start: "18:30", end: "19:30", type: "tumbling",coaches: ["Nikki Rainville", "Swayah Olney"] },
    ],
    camp: [{ name: "Summer Camp", start: "08:00", end: "17:00", type: "camp" }],
  },
  // Thursday
  {
    little: [],
    big: [
      { name: "Team Bronze",   start: "09:00", end: "11:00", type: "team",  coaches: ["Amanda Griswold"] },
      { name: "Team Silver",   start: "09:00", end: "12:00", type: "team",  coaches: ["Amanda Griswold"] },
      { name: "Starz 1",       start: "16:30", end: "17:30", type: "class", coaches: ["Aliyah Allen"] },
      { name: "Starz 3",       start: "17:30", end: "18:30", type: "class", coaches: ["Aliyah Allen"] },
      { name: "Starz 2",       start: "18:30", end: "19:30", type: "class", coaches: ["Aliyah Allen"] },
      { name: "Shining Stars", start: "18:30", end: "19:30", type: "class", coaches: ["Aliyah Allen"] },
    ],
    camp: [{ name: "Summer Camp", start: "08:00", end: "17:00", type: "camp" }],
  },
  // Friday
  {
    little: [],
    big: [
      { name: "Team Gold",         start: "09:00", end: "12:00", type: "team", coaches: ["Emily Mead"] },
      { name: "Team Plat/Diamond", start: "09:00", end: "13:00", type: "team", coaches: ["Emily Mead"] },
    ],
    camp: [{ name: "Summer Camp", start: "08:00", end: "17:00", type: "camp" }],
  },
  // Saturday
  {
    little: [
      { name: "Twinkling Stars", start: "09:30", end: "10:15", type: "preschool", coaches: ["Tamsin Schoedler"] },
      { name: "Twinkling Stars", start: "10:15", end: "11:00", type: "preschool", coaches: ["Aliyah Allen"] },
      { name: "Tiny Stars",      start: "10:15", end: "11:00", type: "preschool", coaches: ["Tamsin Schoedler"] },
      { name: "Shooting Stars",  start: "10:15", end: "11:15", type: "class" },
      { name: "Twinkling Stars", start: "11:15", end: "12:00", type: "preschool", coaches: ["Tamsin Schoedler"] },
      { name: "Shooting Stars",  start: "11:15", end: "12:15", type: "class" },
    ],
    big: [
      { name: "Shining Stars", start: "11:15", end: "12:15", type: "class", coaches: ["Aliyah Allen"] },
    ],
    camp: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const START_HOUR = 8
const END_HOUR = 20
const HOUR_HEIGHT = 64 // px per hour
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

function toMins(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

function layoutBlocks(blocks: ClassBlock[]) {
  if (!blocks.length) return []
  const sorted = [...blocks].sort((a, b) => toMins(a.start) - toMins(b.start))
  const colEnds: number[] = []
  const withCol = sorted.map(b => {
    const s = toMins(b.start)
    let col = colEnds.findIndex(e => e <= s)
    if (col === -1) { col = colEnds.length; colEnds.push(0) }
    colEnds[col] = toMins(b.end)
    return { ...b, col }
  })
  return withCol.map(b => {
    const bs = toMins(b.start), be = toMins(b.end)
    let maxCol = b.col
    withCol.forEach(o => {
      if (toMins(o.start) < be && toMins(o.end) > bs) maxCol = Math.max(maxCol, o.col)
    })
    return { ...b, totalCols: maxCol + 1 }
  })
}

// ─── Timeline Column ──────────────────────────────────────────────────────────

function TimelineColumn({ blocks, label }: { blocks: ClassBlock[]; label?: string }) {
  const laid = layoutBlocks(blocks)

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {label && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
          {label}
        </div>
      )}
      <div className="relative flex-1" style={{ height: TOTAL_HEIGHT }}>
        {/* Hour grid lines */}
        {HOURS.map(h => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-gray-100"
            style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
          />
        ))}

        {/* Half-hour lines */}
        {HOURS.map(h => (
          <div
            key={`half-${h}`}
            className="absolute left-0 right-0 border-t border-gray-50"
            style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
          />
        ))}

        {/* Empty state */}
        {laid.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-gray-300 font-medium">No classes</p>
          </div>
        )}

        {/* Class blocks */}
        {laid.map((b, i) => {
          const top = (toMins(b.start) - START_HOUR * 60) / 60 * HOUR_HEIGHT
          const height = (toMins(b.end) - toMins(b.start)) / 60 * HOUR_HEIGHT
          const s = TYPE_STYLE[b.type]
          const showTime = height >= 36

          return (
            <div
              key={i}
              className="absolute px-0.5 py-0.5"
              style={{
                top,
                height,
                left: `${b.col * 100 / b.totalCols}%`,
                width: `${100 / b.totalCols}%`,
              }}
            >
              <div className={`h-full rounded-lg border overflow-hidden flex flex-col shadow-sm ${s.bg} ${s.border}`}>
                <div className={`h-1 flex-shrink-0 rounded-t-lg ${s.bar}`} />
                <div className="px-1.5 py-1 flex-1 min-h-0 overflow-hidden">
                  <p className={`font-semibold leading-tight text-[11px] ${s.text} line-clamp-2`}>{b.name}</p>
                  {showTime && (
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                      {fmt(b.start)}–{fmt(b.end)}
                    </p>
                  )}
                  {showTime && b.coaches && b.coaches.length > 0 && (
                    <p className={`text-[10px] mt-0.5 leading-tight font-medium ${s.text} opacity-70 truncate`}>
                      {b.coaches.map(c => c.split(" ")[0]).join(", ")}
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
    <div className="flex-shrink-0 w-12 relative bg-white border-r border-gray-100" style={{ height: TOTAL_HEIGHT }}>
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
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const GYM_KEYS = ["little", "big", "camp"] as const
const GYM_LABELS: Record<string, string> = { little: "Little Gym", big: "Big Gym", camp: "Camp" }

export default function ClassSchedulePage() {
  const [dayIdx, setDayIdx] = useState(() => {
    // Default to today's day (Mon=0…Sat=5), fallback to Mon
    const d = new Date().getDay() // 0=Sun
    return d >= 1 && d <= 6 ? d - 1 : 0
  })
  const [gymKey, setGymKey] = useState<"little" | "big" | "camp">("little")

  const day = SCHEDULE[dayIdx]

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="px-4 pt-5 pb-0">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Class Schedule</h1>

          {/* Day tabs */}
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => setDayIdx(i)}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
                  dayIdx === i
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile gym tabs */}
        <div className="md:hidden flex border-t border-gray-100">
          {GYM_KEYS.map(key => (
            <button
              key={key}
              onClick={() => setGymKey(key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                gymKey === key
                  ? "text-violet-700 border-b-2 border-violet-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {GYM_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        {(Object.entries(TYPE_STYLE) as [ClassType, typeof TYPE_STYLE[ClassType]][]).map(([, s]) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.bar}`} />
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* Mobile: single column */}
        <div className="md:hidden flex">
          <TimeAxis />
          <TimelineColumn blocks={day[gymKey]} />
        </div>

        {/* Desktop: three columns side by side */}
        <div className="hidden md:flex h-full">
          <TimeAxis />
          {GYM_KEYS.map(key => (
            <TimelineColumn key={key} blocks={day[key]} label={GYM_LABELS[key]} />
          ))}
        </div>

      </div>
    </div>
  )
}

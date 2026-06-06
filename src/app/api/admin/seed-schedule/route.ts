import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// ─── Schedule Data ────────────────────────────────────────────────────────────
// day: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// coaches: full names matching profiles.full_name

type ClassDef = {
  day: number
  name: string
  start: string
  end: string
  type: string
  location: string
  coaches: string[]
}

const ALL_CLASSES: ClassDef[] = [
  // ── MONDAY ──────────────────────────────────────────────────────────────────
  { day: 1, name: "Shining Stars",     start: "16:30", end: "17:30", type: "class", location: "Little Gym", coaches: [] },
  { day: 1, name: "Shining Stars",     start: "17:30", end: "18:30", type: "class", location: "Little Gym", coaches: [] },
  { day: 1, name: "Team Bronze",       start: "09:00", end: "11:00", type: "team",  location: "Big Gym",    coaches: ["Amanda Griswold"] },
  { day: 1, name: "Team Silver",       start: "09:00", end: "12:00", type: "team",  location: "Big Gym",    coaches: ["Amanda Griswold"] },
  { day: 1, name: "Team Gold",         start: "09:00", end: "12:00", type: "team",  location: "Big Gym",    coaches: ["Emily Mead"] },
  { day: 1, name: "Team Plat/Diamond", start: "09:00", end: "13:00", type: "team",  location: "Big Gym",    coaches: ["Emily Mead"] },
  { day: 1, name: "Starz 1",           start: "16:30", end: "17:30", type: "class", location: "Big Gym",    coaches: ["Aliyah Allen"] },
  { day: 1, name: "Starz 3",           start: "17:30", end: "18:30", type: "class", location: "Big Gym",    coaches: ["Aliyah Allen"] },
  { day: 1, name: "Starz 2",           start: "18:30", end: "19:30", type: "class", location: "Big Gym",    coaches: ["Aliyah Allen"] },

  // ── TUESDAY ─────────────────────────────────────────────────────────────────
  { day: 2, name: "Shooting Stars",    start: "13:00", end: "14:00", type: "class",     location: "Little Gym", coaches: [] },
  { day: 2, name: "Ninja 1",           start: "16:30", end: "17:30", type: "class",     location: "Little Gym", coaches: ["Brynlee Cafferty"] },
  { day: 2, name: "Twinkling Stars",   start: "16:45", end: "17:30", type: "preschool", location: "Little Gym", coaches: ["Tamsin Schoedler"] },
  { day: 2, name: "Shooting Stars",    start: "17:30", end: "18:30", type: "class",     location: "Little Gym", coaches: ["Mckenna Alvey"] },
  { day: 2, name: "Shooting Stars",    start: "18:30", end: "19:30", type: "class",     location: "Little Gym", coaches: ["Tamsin Schoedler"] },
  { day: 2, name: "Team Bronze",       start: "09:00", end: "11:00", type: "team",      location: "Big Gym",    coaches: ["Mckenna Alvey", "Amanda Griswold", "Emily Mead"] },
  { day: 2, name: "Team Silver",       start: "09:00", end: "12:00", type: "team",      location: "Big Gym",    coaches: ["Mckenna Alvey", "Amanda Griswold", "Emily Mead"] },
  { day: 2, name: "Shining Stars",     start: "16:30", end: "17:30", type: "class",     location: "Big Gym",    coaches: ["Aliyah Allen"] },
  { day: 2, name: "Super Stars",       start: "17:00", end: "18:30", type: "class",     location: "Big Gym",    coaches: ["Nikki Rainville"] },
  { day: 2, name: "Pre-Team",          start: "17:00", end: "19:00", type: "team",      location: "Big Gym",    coaches: ["Mckenna Alvey"] },
  { day: 2, name: "Shining Stars",     start: "17:30", end: "18:30", type: "class",     location: "Big Gym",    coaches: ["Aliyah Allen"] },
  { day: 2, name: "Ninja 2",           start: "17:30", end: "18:30", type: "class",     location: "Big Gym",    coaches: ["Brynlee Cafferty"] },
  { day: 2, name: "Shining Stars",     start: "18:30", end: "19:30", type: "class",     location: "Big Gym",    coaches: ["Aliyah Allen"] },
  { day: 2, name: "Ninja 3",           start: "18:30", end: "19:30", type: "class",     location: "Big Gym",    coaches: ["Brynlee Cafferty", "Swayah Olney"] },

  // ── WEDNESDAY ───────────────────────────────────────────────────────────────
  { day: 3, name: "Tiny Stars",        start: "16:30", end: "17:15", type: "preschool", location: "Little Gym", coaches: ["Tamsin Schoedler"] },
  { day: 3, name: "Shooting Stars",    start: "16:30", end: "17:30", type: "class",     location: "Little Gym", coaches: ["Mckenna Alvey"] },
  { day: 3, name: "Ninja 1",           start: "16:30", end: "17:30", type: "class",     location: "Little Gym", coaches: ["Brynlee Cafferty", "Adam Santiago"] },
  { day: 3, name: "Twinkling Stars",   start: "17:30", end: "18:15", type: "preschool", location: "Little Gym", coaches: ["Mckenna Alvey"] },
  { day: 3, name: "Shooting Stars",    start: "17:30", end: "18:30", type: "class",     location: "Little Gym", coaches: ["Nikki Rainville"] },
  { day: 3, name: "Ninja 3",           start: "18:30", end: "19:30", type: "class",     location: "Little Gym", coaches: ["Adam Santiago", "Brynlee Cafferty"] },
  { day: 3, name: "Team Gold",         start: "09:00", end: "12:00", type: "team",      location: "Big Gym",    coaches: ["Emily Mead"] },
  { day: 3, name: "Team Plat/Diamond", start: "09:00", end: "13:00", type: "team",      location: "Big Gym",    coaches: ["Emily Mead"] },
  { day: 3, name: "Tumbling",          start: "12:00", end: "13:00", type: "class",     location: "Big Gym",    coaches: [] },
  { day: 3, name: "Shining Stars",     start: "12:00", end: "13:00", type: "class",     location: "Big Gym",    coaches: [] },
  { day: 3, name: "Shining Stars",     start: "16:30", end: "17:30", type: "class",     location: "Big Gym",    coaches: ["Nikki Rainville"] },
  { day: 3, name: "Adv Tumbling",      start: "17:30", end: "18:30", type: "class",     location: "Big Gym",    coaches: ["Adam Santiago"] },
  { day: 3, name: "Shining Stars",     start: "17:30", end: "18:30", type: "class",     location: "Big Gym",    coaches: ["Aliyah Allen", "Nikki Rainville"] },
  { day: 3, name: "Shining Stars",     start: "18:15", end: "19:15", type: "class",     location: "Big Gym",    coaches: ["Mckenna Alvey"] },
  { day: 3, name: "Beg Tumbling",      start: "18:30", end: "19:30", type: "class",     location: "Big Gym",    coaches: ["Nikki Rainville", "Swayah Olney"] },

  // ── THURSDAY ────────────────────────────────────────────────────────────────
  { day: 4, name: "Team Bronze",       start: "09:00", end: "11:00", type: "team",  location: "Big Gym", coaches: ["Amanda Griswold"] },
  { day: 4, name: "Team Silver",       start: "09:00", end: "12:00", type: "team",  location: "Big Gym", coaches: ["Amanda Griswold"] },
  { day: 4, name: "Starz 1",           start: "16:30", end: "17:30", type: "class", location: "Big Gym", coaches: ["Aliyah Allen"] },
  { day: 4, name: "Starz 3",           start: "17:30", end: "18:30", type: "class", location: "Big Gym", coaches: ["Aliyah Allen"] },
  { day: 4, name: "Starz 2",           start: "18:30", end: "19:30", type: "class", location: "Big Gym", coaches: ["Aliyah Allen"] },
  { day: 4, name: "Shining Stars",     start: "18:30", end: "19:30", type: "class", location: "Big Gym", coaches: ["Aliyah Allen"] },

  // ── FRIDAY ──────────────────────────────────────────────────────────────────
  { day: 5, name: "Team Gold",         start: "09:00", end: "12:00", type: "team", location: "Big Gym", coaches: ["Emily Mead"] },
  { day: 5, name: "Team Plat/Diamond", start: "09:00", end: "13:00", type: "team", location: "Big Gym", coaches: ["Emily Mead"] },

  // ── SATURDAY ────────────────────────────────────────────────────────────────
  { day: 6, name: "Twinkling Stars",   start: "09:30", end: "10:15", type: "preschool", location: "Little Gym", coaches: ["Tamsin Schoedler"] },
  { day: 6, name: "Twinkling Stars",   start: "10:15", end: "11:00", type: "preschool", location: "Little Gym", coaches: ["Aliyah Allen"] },
  { day: 6, name: "Tiny Stars",        start: "10:15", end: "11:00", type: "preschool", location: "Little Gym", coaches: ["Tamsin Schoedler"] },
  { day: 6, name: "Shooting Stars",    start: "10:15", end: "11:15", type: "class",     location: "Little Gym", coaches: [] },
  { day: 6, name: "Twinkling Stars",   start: "11:15", end: "12:00", type: "preschool", location: "Little Gym", coaches: ["Tamsin Schoedler"] },
  { day: 6, name: "Shooting Stars",    start: "11:15", end: "12:15", type: "class",     location: "Little Gym", coaches: [] },
  { day: 6, name: "Shining Stars",     start: "11:15", end: "12:15", type: "class",     location: "Big Gym",    coaches: ["Aliyah Allen"] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOfWeek(offset = 0): Date {
  const today = new Date()
  const jsDay = today.getDay() // 0=Sun...6=Sat
  const monday = new Date(today)
  monday.setDate(today.getDate() - (jsDay === 0 ? 6 : jsDay - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getDateForClass(monday: Date, dayNum: number): Date {
  // dayNum: 1=Mon...6=Sat → offset from monday: 0...5
  const d = new Date(monday)
  d.setDate(monday.getDate() + (dayNum - 1))
  return d
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST() {
  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const results = { recurring: 0, blocks: 0, multiCoach: 0, openShifts: 0, errors: [] as string[] }

  // ── 1. Build coach name → id map ──────────────────────────────────────────
  const { data: profiles } = await db.from("profiles").select("id, full_name")
  const nameToId = new Map((profiles ?? []).map((p) => [p.full_name, p.id]))

  // ── 2. Create recurring_shifts ────────────────────────────────────────────
  const recurringIds: (string | null)[] = []

  for (const cls of ALL_CLASSES) {
    const primaryCoachId = cls.coaches.length > 0 ? (nameToId.get(cls.coaches[0]) ?? null) : null
    const staffName = cls.coaches.length === 0 ? null
      : cls.coaches.length === 1 ? cls.coaches[0]
      : cls.coaches.map((n) => n.split(" ")[0]).join(", ")

    // Check for existing
    const { data: existing } = await db
      .from("recurring_shifts")
      .select("id")
      .eq("title", cls.name)
      .eq("day_of_week", cls.day)
      .eq("start_time", cls.start)
      .eq("location", cls.location)
      .maybeSingle()

    let rid: string | null = existing?.id ?? null

    if (!rid) {
      const { data: inserted, error } = await db
        .from("recurring_shifts")
        .insert({
          title: cls.name,
          type: cls.type,
          day_of_week: cls.day,
          start_time: cls.start,
          end_time: cls.end,
          location: cls.location,
          assigned_coach_id: primaryCoachId,
          active: true,
        })
        .select("id")
        .single()

      if (error) { results.errors.push(`recurring: ${cls.name} ${cls.day} ${cls.start}: ${error.message}`); rid = null }
      else { rid = inserted?.id ?? null; results.recurring++ }
    }

    // Multi-coach: populate recurring_shift_coaches
    if (rid && cls.coaches.length > 1) {
      for (const name of cls.coaches) {
        const cid = nameToId.get(name)
        if (!cid) continue
        const { error } = await db
          .from("recurring_shift_coaches")
          .upsert({ recurring_shift_id: rid, coach_id: cid }, { onConflict: "recurring_shift_id,coach_id" })
        if (!error) results.multiCoach++
      }
    }

    recurringIds.push(rid)
  }

  // ── 3. Create schedule_blocks for next 13 weeks ───────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0)

  for (let week = 0; week < 13; week++) {
    const monday = getMondayOfWeek(week)

    for (let i = 0; i < ALL_CLASSES.length; i++) {
      const cls = ALL_CLASSES[i]
      const rid = recurringIds[i]
      const date = getDateForClass(monday, cls.day)
      if (date < today) continue

      const dateStr = date.toISOString().split("T")[0]

      // Skip if block already exists
      const { data: existing } = await db
        .from("schedule_blocks")
        .select("id")
        .eq("title", cls.name)
        .eq("date", dateStr)
        .eq("start_time", cls.start)
        .eq("location", cls.location)
        .maybeSingle()

      if (existing) continue

      const primaryCoachId = cls.coaches.length === 1 ? (nameToId.get(cls.coaches[0]) ?? null) : null
      const staffName = cls.coaches.length === 0 ? null
        : cls.coaches.length === 1 ? cls.coaches[0]
        : cls.coaches.map((n) => n.split(" ")[0]).join(", ")

      const { data: block, error } = await db
        .from("schedule_blocks")
        .insert({
          title: cls.name,
          type: cls.type,
          start_time: cls.start,
          end_time: cls.end,
          location: cls.location,
          staff: staffName,
          coach_id: primaryCoachId,
          date: dateStr,
          enrolled: 0,
          recurring_shift_id: rid ?? null,
        })
        .select("id")
        .single()

      if (error) { results.errors.push(`block: ${cls.name} ${dateStr}: ${error.message}`); continue }
      results.blocks++

      // Multi-coach: schedule_block_coaches
      if (block?.id && cls.coaches.length > 1) {
        for (const name of cls.coaches) {
          const cid = nameToId.get(name)
          if (!cid) continue
          await db
            .from("schedule_block_coaches")
            .upsert({ block_id: block.id, coach_id: cid }, { onConflict: "block_id,coach_id" })
        }
      }
    }
  }

  // ── 4. Create open shifts for unassigned classes (next 4 weeks) ───────────
  const unassigned = ALL_CLASSES.filter((c) => c.coaches.length === 0)

  for (let week = 0; week < 4; week++) {
    const monday = getMondayOfWeek(week)
    for (const cls of unassigned) {
      const date = getDateForClass(monday, cls.day)
      if (date < today) continue
      const dateStr = date.toISOString().split("T")[0]

      const { data: existing } = await db
        .from("shifts")
        .select("id")
        .eq("title", cls.name)
        .eq("date", dateStr)
        .eq("start_time", cls.start)
        .maybeSingle()

      if (existing) continue

      const { error } = await db.from("shifts").insert({
        title: cls.name,
        type: cls.type,
        date: dateStr,
        start_time: cls.start,
        end_time: cls.end,
        location: cls.location,
        rate: 20,
        total_spots: 1,
      })
      if (!error) results.openShifts++
    }
  }

  return NextResponse.json({
    ok: true,
    ...results,
    message: `Created ${results.recurring} recurring shifts, ${results.blocks} schedule blocks, ${results.openShifts} open claimable shifts`,
  })
}

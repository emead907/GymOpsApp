"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

type StaffMember = {
  id: string
  full_name: string
  role: string
  email?: string
}

const ROLES = ["coach", "front_desk", "admin"]
const roleLabel: Record<string, string> = {
  coach: "Coach",
  front_desk: "Front Desk",
  admin: "Admin",
}
const roleBadge: Record<string, string> = {
  coach: "bg-violet-100 text-violet-700",
  front_desk: "bg-blue-100 text-blue-700",
  admin: "bg-red-100 text-red-700",
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

function avatarColor(id: string) {
  const colors = [
    "bg-violet-200 text-violet-800",
    "bg-blue-200 text-blue-800",
    "bg-green-200 text-green-800",
    "bg-pink-200 text-pink-800",
    "bg-orange-200 text-orange-800",
    "bg-teal-200 text-teal-800",
  ]
  const idx = id.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function StaffPage() {
  const supabase = createClient()

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMember, setEditMember] = useState<StaffMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "coach",
  })

  const loadStaff = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name")
    setStaff(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadStaff() }, [loadStaff])

  function openAdd() {
    setEditMember(null)
    setForm({ full_name: "", email: "", password: "", role: "coach" })
    setError("")
    setShowModal(true)
  }

  function openEdit(member: StaffMember) {
    setEditMember(member)
    setForm({ full_name: member.full_name, email: "", password: "", role: member.role })
    setError("")
    setShowModal(true)
  }

  async function handleSave() {
    setError("")
    if (!form.full_name.trim()) { setError("Name is required."); return }

    setSaving(true)

    if (editMember) {
      // Just update the profile row (name / role)
      const { error: err } = await supabase
        .from("profiles")
        .update({ full_name: form.full_name, role: form.role })
        .eq("id", editMember.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      // Create new auth user + profile via server API
      if (!form.email.trim() || !form.password.trim()) {
        setError("Email and password are required for new staff.")
        setSaving(false)
        return
      }
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Something went wrong."); setSaving(false); return }
    }

    setSaving(false)
    setShowModal(false)
    loadStaff()
  }

  async function handleDelete(member: StaffMember) {
    if (!confirm(`Remove ${member.full_name} from staff? This cannot be undone.`)) return
    await supabase.from("profiles").delete().eq("id", member.id)
    loadStaff()
  }

  const filtered = staff.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const byRole = ROLES.map((r) => ({
    role: r,
    members: filtered.filter((s) => s.role === r),
  })).filter((g) => g.members.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
            <p className="text-sm text-gray-500 mt-0.5">{staff.length} team member{staff.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold transition flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Add Staff
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
      </div>

      <div className="p-6 space-y-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium">No staff found</p>
            <p className="text-sm mt-1">Add your first team member to get started.</p>
          </div>
        ) : (
          byRole.map(({ role, members }) => (
            <div key={role}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                {roleLabel[role]} · {members.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor(member.id)}`}>
                      {initials(member.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{member.full_name}</p>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${roleBadge[member.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {roleLabel[member.role] ?? member.role}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openEdit(member)}
                        className="text-xs text-violet-600 hover:text-violet-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editMember ? "Edit Staff Member" : "Add Staff Member"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Jane Smith"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{roleLabel[r]}</option>
                  ))}
                </select>
              </div>

              {!editMember && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Temporary Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="They can change this later"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    The coach will log in with this email and password. They can update their password from settings.
                  </p>
                </>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-2xl text-sm font-semibold transition disabled:opacity-60"
              >
                {saving ? "Saving..." : editMember ? "Save Changes" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

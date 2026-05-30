"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { label: "Schedule", href: "/schedule", icon: "⊞" },
  { label: "Camps", href: "/camps", icon: "⛺" },
  { label: "Staff", href: "/staff", icon: "👤" },
  { label: "Shift Signups", href: "/shift-signups", icon: "📋" },
  { label: "Shift Mgmt", href: "/shift-management", icon: "🗂️" },
  { label: "Time Clock", href: "/time-clock", icon: "🕐" },
  { label: "Events", href: "/events", icon: "📅" },
  { label: "Reports", href: "/reports", icon: "📊" },
  { label: "Messages", href: "/messages", icon: "💬" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
]

// The 5 most important for the mobile bottom bar
const mobileNav = [
  { label: "Schedule", href: "/schedule", icon: "⊞" },
  { label: "Shifts", href: "/shift-signups", icon: "📋" },
  { label: "Mgmt", href: "/shift-management", icon: "🗂️" },
  { label: "Clock", href: "/time-clock", icon: "🕐" },
  { label: "Camps", href: "/camps", icon: "⛺" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col h-screen sticky top-0">
        <div className="px-6 py-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-violet-700">Gym Stars</h1>
          <p className="text-xs text-gray-400 mt-0.5">Operations Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
              JD
            </div>
            <div className="text-left">
              <p className="text-gray-800 font-medium text-xs">Jane Doe</p>
              <p className="text-gray-400 text-xs">Gym Manager</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-stretch safe-area-pb">
        {mobileNav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
                active ? "text-violet-700" : "text-gray-400"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

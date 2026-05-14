"use client"

import { useState } from "react"
import ScheduleBlock from "@/components/ScheduleBlock"

export default function Home() {
  const [showModal, setShowModal] = useState(false)
  return (
    <main className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10">
          GymOps
        </h1>

        <nav className="space-y-4">
          <div className="bg-blue-600 rounded-lg px-4 py-3">
            Schedule
          </div>

          <div className="px-4 py-3 hover:bg-slate-800 rounded-lg cursor-pointer">
            Camps
          </div>

          <div className="px-4 py-3 hover:bg-slate-800 rounded-lg cursor-pointer">
            Staff
          </div>

          <div className="px-4 py-3 hover:bg-slate-800 rounded-lg cursor-pointer">
            Shift Signups
          </div>

          <div className="px-4 py-3 hover:bg-slate-800 rounded-lg cursor-pointer">
            Time Clock
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-8 overflow-auto">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Master Schedule
            </h2>

            <p className="text-gray-500 mt-1">
              Summer scheduling dashboard
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium"
          >
            + Add Block
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">
              Blocks Today
            </p>

            <h3 className="text-3xl font-bold mt-2">
              11
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">
              Staff Assigned
            </p>

            <h3 className="text-3xl font-bold mt-2">
              28
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">
              Enrollment
            </p>

            <h3 className="text-3xl font-bold mt-2">
              142
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm">
              Conflicts
            </p>

            <h3 className="text-3xl font-bold mt-2 text-red-500">
              2
            </h3>
          </div>

        </div>

       {/* Schedule Grid */}
<div className="bg-white rounded-2xl shadow-sm overflow-hidden">

  {/* Header Row */}
  <div className="grid grid-cols-6 border-b bg-gray-50">
    <div className="p-4 font-semibold text-gray-500 border-r">
      Time
    </div>

    <div className="p-4 font-semibold border-r">
      Big Gym
    </div>

    <div className="p-4 font-semibold border-r">
     Little Gym
    </div>

    <div className="p-4 font-semibold border-r">
      Party Room
    </div>

    <div className="p-4 font-semibold border-r">
      Preschool Room
    </div>

    <div className="p-4 font-semibold border-r">
      Classrooms
    </div>
  </div>

  {/* Time Rows */}
  {[
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
  ].map((time) => (
    <div
      key={time}
      className="grid grid-cols-6 border-b min-h-[100px]"
    >

      {/* Time Column */}
      <div className="p-4 border-r text-sm text-gray-500">
        {time}
      </div>


      {/* Gym Floor */}
      <div className="border-r p-2 relative">
        {time === "8:00 AM" && (
          <ScheduleBlock
            title="Summer Camp"
            time="8:00 AM - 12:00 PM"
            staff="Emily + 3"
            capacity="42 / 50"
            type="camp"
          />
        )}

        {time === "1:00 PM" && (
          <ScheduleBlock
            title="Ninja"
            time="1:00 PM - 2:00 PM"
            staff="Adam"
            capacity="6/8"
            type="class"
          />
        )}
      </div>

      {/* Rec Gym */}
      <div className="border-r p-2 relative">
        {time === "9:00 AM" && (
         <ScheduleBlock
            title="Twinking Stars"
            time="9:00 AM - 9:45 AM"
            staff="Nikki"
            capacity="8/8"
            type="class"
          />
        )}
      </div>

      {/* Party Room */}
      <div className="border-r p-2 relative">
        {time === "4:00 PM" && (
          <ScheduleBlock
            title="Birthday Party"
            time="4:00 PM - 5:30 PM"
            staff="Mckenna"
            capacity="11/25"
            type="party"
          />
        )}
      </div>

      {/* Preschool room */}
      <div className="border-r p-2 relative">
        {time === "9:00 AM" && (
          <ScheduleBlock
            title="Preschool"
            time="9:15 AM - 12:00 PM"
            staff="Desia"
            capacity="9/9"
            type="preschool"
          />
        )}
      </div>

    </div>

    
  ))}

</div>

      </section>
{/* Add Block Modal */}
{showModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-3xl w-[540px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Add Schedule Block
        </h2>

        <button
          onClick={() => setShowModal(false)}
          className="text-gray-500 hover:text-black"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title
          </label>

          <input
            className="w-full border rounded-xl p-3"
            placeholder="Summer Camp"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Block Type
          </label>

          <select className="w-full border rounded-xl p-3">
            <option>Camp</option>
            <option>Class</option>
            <option>Team</option>
            <option>Party</option>
            <option>Preschool</option>
            <option>Event</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Start Time
            </label>

            <input
              type="time"
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              End Time
            </label>

            <input
              type="time"
              className="w-full border rounded-xl p-3"
            />
          </div>

        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Location
          </label>

          <select className="w-full border rounded-xl p-3">
            <option>Big Gym</option>
            <option>Little Gym</option>
            <option>Party Room</option>
            <option>Preschool Room</option>
            <option>Classrooms</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Staff
          </label>

          <input
            className="w-full border rounded-xl p-3"
            placeholder="Coach Emily"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Capacity
          </label>

          <input
            className="w-full border rounded-xl p-3"
            placeholder="25"
          />
        </div>

      </div>

      <div className="flex justify-end gap-3 mt-8">

        <button
          onClick={() => setShowModal(false)}
          className="px-5 py-3 rounded-xl border"
        >
          Cancel
        </button>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl">
          Save Block
        </button>

      </div>

    </div>

  </div>
)}
    </main>
  )
}
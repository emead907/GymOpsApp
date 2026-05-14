"use client"

import { useState } from "react"
import ScheduleBlock from "@/components/ScheduleBlock"

type ScheduleItem = {
  id: number
  title: string
  time: string
  staff: string
  capacity: string
  type: "camp" | "class" | "team" | "party" | "openGym" | "preschool" | "event"
  location: string
  startHour: string
}

export default function Home() {
  const [showModal, setShowModal] = useState(false)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])

const [formData, setFormData] = useState({
  title: "",
  type: "camp" as ScheduleItem["type"],
  startTime: "",
  endTime: "",
  location: "Big Gym",
  staff: "",
  capacity: "",
})

function handleSaveBlock() {
  const newBlock: ScheduleItem = {
    id: Date.now(),
    title: formData.title,
    type: formData.type,
    time: `${formData.startTime} - ${formData.endTime}`,
    staff: formData.staff,
    capacity: formData.capacity,
    location: formData.location,
    startHour: formData.startTime.slice(0, 2),
  }

  setScheduleItems([...scheduleItems, newBlock])

  setFormData({
    title: "",
    type: "camp",
    startTime: "",
    endTime: "",
    location: "Big Gym",
    staff: "",
    capacity: "",
  })

  setShowModal(false)
}

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


        {/* Big Gym */}
        <div className="border-r p-2 relative">

          {scheduleItems
            .filter(
              (item) =>
                item.location === "Big Gym" &&
                item.startHour === time.slice(0, 2)
            )
            .map((item) => (
              <ScheduleBlock
                key={item.id}
                title={item.title}
                time={item.time}
                staff={item.staff}
                capacity={item.capacity}
                type={item.type}
              />
            ))}

        </div>

        {/* Little Gym */}
        <div className="border-r p-2 relative">

          {scheduleItems
            .filter(
              (item) =>
                item.location === "Little Gym" &&
                item.startHour === time.slice(0, 2)
            )
            .map((item) => (
              <ScheduleBlock
                key={item.id}
                title={item.title}
                time={item.time}
                staff={item.staff}
                capacity={item.capacity}
                type={item.type}
              />
            ))}

        </div>

      {/* Party Room */}
      <div className="border-r p-2 relative">

        {scheduleItems
          .filter(
            (item) =>
              item.location === "Party Room" &&
              item.startHour === time.slice(0, 2)
          )
          .map((item) => (
            <ScheduleBlock
              key={item.id}
              title={item.title}
              time={item.time}
              staff={item.staff}
              capacity={item.capacity}
              type={item.type}
            />
          ))}

      </div>

     {/* Preschool Room */}
    <div className="border-r p-2 relative">

      {scheduleItems
        .filter(
          (item) =>
            item.location === "Preschool Room" &&
            item.startHour === time.slice(0, 2)
        )
        .map((item) => (
          <ScheduleBlock
            key={item.id}
            title={item.title}
            time={item.time}
            staff={item.staff}
            capacity={item.capacity}
            type={item.type}
          />
        ))}

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
        <p className="text-sm text-gray-500 mt-1">
          Create a new class, camp, event, or activity block.
        </p>

        <button
          onClick={() => setShowModal(false)}
          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black transition"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5">

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title
          </label>

          <input
            value={formData.title}
            onChange={(e) =>
              setFormData({
                ...formData,
                title: e.target.value,
              })
            }
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Summer Camp"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Block Type
          </label>

          <select
  value={formData.type}
  onChange={(e) =>
    setFormData({
      ...formData,
      type: e.target.value as ScheduleItem["type"],
    })
  }
  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Time
            </label>

           <input
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startTime: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Time
            </label>

            <input
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endTime: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location
          </label>

          <select
            value={formData.location}
            onChange={(e) =>
              setFormData({
                ...formData,
                location: e.target.value,
              })
            }
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option>Big Gym</option>
            <option>Little Gym</option>
            <option>Party Room</option>
            <option>Preschool Room</option>
            <option>Classrooms</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Staff
          </label>

         <input
          value={formData.staff}
          onChange={(e) =>
            setFormData({
              ...formData,
              staff: e.target.value,
            })
          }
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          placeholder="Coach Emily"
        />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Capacity
          </label>

          <input
          value={formData.capacity}
          onChange={(e) =>
            setFormData({
              ...formData,
              capacity: e.target.value,
            })
          }
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          placeholder="25"
        />
        </div>

      </div>

      <div className="flex justify-end gap-3 mt-8">

        <button
         onClick={() => {
            setFormData({
              title: "",
              type: "camp",
              startTime: "",
              endTime: "",
              location: "Big Gym",
              staff: "",
              capacity: "",
            })

            setShowModal(false)
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleSaveBlock}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-sm hover:shadow-md transition"
        >
          Save Block
        </button>

      </div>

    </div>

  </div>
)}
    </main>
  )
}
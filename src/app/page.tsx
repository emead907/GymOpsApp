export default function Home() {
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

          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium">
            + Add Block
          </button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          
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

        {/* Empty Schedule Area */}
        <div className="bg-white rounded-2xl shadow-sm p-10 h-[600px]">
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl h-full flex items-center justify-center">
            
            <p className="text-gray-400 text-lg">
              Schedule board coming next...
            </p>

          </div>

        </div>

      </section>

    </main>
  )
}
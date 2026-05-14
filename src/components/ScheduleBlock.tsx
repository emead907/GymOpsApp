type ScheduleBlockProps = {
  title: string
  time: string
  staff?: string
  capacity?: string
 type:
  | "camp"
  | "class"
  | "team"
  | "party"
  | "openGym"
  | "preschool"
  | "event"
}

const blockStyles = {
  camp: "bg-blue-100 border-blue-300 text-blue-900",
  class: "bg-purple-100 border-purple-300 text-purple-900",
  team: "bg-green-100 border-green-300 text-green-900",
  party: "bg-pink-100 border-pink-300 text-pink-900",
  openGym: "bg-orange-100 border-orange-300 text-orange-900",
  preschool: "bg-yellow-100 border-yellow-300 text-yellow-900",
  event: "bg-red-100 border-red-300 text-red-900",
}

export default function ScheduleBlock({
  title,
  time,
  staff,
  capacity,
  type,
}: ScheduleBlockProps) {
  return (
    <div
      className={`rounded-2xl border p-3 text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${blockStyles[type]}`}
    >
      <p className="font-semibold">{title}</p>

      <p className="mt-1 text-xs opacity-80">{time}</p>

      {staff && (
        <p className="mt-2 text-xs">
          Staff: {staff}
        </p>
      )}

      {capacity && (
        <p className="mt-1 text-xs">
          Capacity: {capacity}
        </p>
      )}
    </div>
  )
}
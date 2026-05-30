type ScheduleBlockProps = {
  title: string
  time: string
  staff?: string
  capacity?: string
  type: "camp" | "class" | "team" | "party" | "openGym" | "preschool" | "event"
  onClick?: () => void
  compact?: boolean
}

const blockStyles: Record<string, string> = {
  camp: "bg-blue-100 border-blue-300 text-blue-900",
  class: "bg-violet-100 border-violet-300 text-violet-900",
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
  onClick,
  compact = false,
}: ScheduleBlockProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-2 text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full ${blockStyles[type]}`}
    >
      <p className="font-semibold text-xs leading-tight truncate">{title}</p>
      <p className="mt-0.5 opacity-75 truncate">{time}</p>
      {!compact && staff && <p className="mt-1 opacity-80 truncate">{staff}</p>}
      {!compact && capacity && <p className="opacity-70">{capacity} spots</p>}
    </div>
  )
}

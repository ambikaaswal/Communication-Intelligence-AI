"use client";
const avatarColors = [
  "bg-violet-500/20 text-violet-300",
  "bg-indigo-500/20 text-indigo-300",
  "bg-sky-500/20 text-sky-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-amber-500/20 text-amber-300",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getColorClass(name: string) {
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

export function PersonChip({ name }: { name: string }) {
  const colorClass = getColorClass(name);
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${colorClass}`}
      >
        {getInitials(name)}
      </div>
      <span className="text-sm text-white/70">{name}</span>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PersonChip } from "../components/PersonChip";
import {
  listTasks,
  listDecisions,
  listConversations,
  updateTask,
  updateDecision,
  type Task,
  type Decision,
} from "@/services/api";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  MessageSquare,
  Upload,
  Sparkles,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

function isUrgent(deadline: string | null) {
  if (!deadline) return false;
  const diff = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff < 2;
}

function isOverdue(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const TASK_STATUSES = ["open", "in_progress", "done", "blocked"] as const;
const DECISION_TYPES = ["decision", "approval_pending", "approval_granted"] as const;

const statusColors: Record<string, string> = {
  open: "bg-white/5 text-white/60 border-white/10",
  in_progress: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  done: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  blocked: "bg-red-500/10 text-red-300 border-red-500/20",
};

const typeColors: Record<string, string> = {
  decision: "bg-white/5 text-white/60 border-white/10",
  approval_pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  approval_granted: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
};

function InlineSelect({
  value,
  options,
  colorMap,
  onChange,
}: {
  value: string;
  options: readonly string[];
  colorMap: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-xs font-medium rounded-md border pl-2.5 pr-6 py-1 appearance-none cursor-pointer focus:outline-none transition-colors ${colorMap[value] ?? colorMap.open}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#1a1a24] text-white/80">
            {opt.replace("_", " ")}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
    </div>
  );
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [conversationCount, setConversationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([listTasks(), listDecisions(), listConversations()])
      .then(([t, d, c]) => {
        setTasks(t);
        setDecisions(d);
        setConversationCount(c.length);
      })
      .catch((err) => {
      console.error('Failed to load dashboard data:', err);
      })
      .finally(() => setLoading(false));
  }

  async function handleTaskStatusChange(taskId: string, newStatus: string) {
    // Optimistic update — reflect the change instantly, don't wait on the network
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as Task["status"] } : t)));
    try {
      await updateTask(taskId, { status: newStatus as Task["status"] });
    } catch {
      // Revert on failure
      loadAll();
    }
  }

  async function handleDecisionTypeChange(decisionId: string, newType: string) {
    setDecisions((prev) => prev.map((d) => (d.id === decisionId ? { ...d, type: newType as Decision["type"] } : d)));
    try {
      await updateDecision(decisionId, { type: newType as Decision["type"] });
    } catch {
      loadAll();
    }
  }

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const visibleTasks = showCompleted ? tasks : tasks.filter((t) => t.status !== "done");

  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const pendingApprovals = decisions.filter((d) => d.type === "approval_pending").length;
  const isEmpty = !loading && tasks.length === 0 && decisions.length === 0;

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white/90 tracking-tight">Dashboard</h1>
        <p className="text-sm text-white/35 mt-1">All extracted project data at a glance.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Open Tasks", value: openTasks, icon: CheckSquare, color: "text-indigo-400", bg: "bg-indigo-500/8" },
          { label: "Pending Approvals", value: pendingApprovals, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/8" },
          { label: "Conversations Processed", value: conversationCount, icon: MessageSquare, color: "text-sky-400", bg: "bg-sky-500/8" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-white/90">{value}</div>
              <div className="text-xs text-white/35 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-24 text-sm text-white/30">Loading…</div>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Tasks</h2>
              <div className="flex items-center gap-3">
                {doneCount > 0 && (
                  <button
                    onClick={() => setShowCompleted((s) => !s)}
                    className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
                  >
                    {showCompleted ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showCompleted ? "Hide" : "Show"} completed ({doneCount})
                  </button>
                )}
                <span className="text-xs text-white/25">{visibleTasks.length} items</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Task", "Owner", "Deadline", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-white/25 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map((task, i) => {
                    const urgent = isUrgent(task.deadline);
                    const overdue = isOverdue(task.deadline) && task.status !== "done";
                    return (
                      <tr key={task.id} className={`group transition-colors hover:bg-white/[0.025] ${i !== visibleTasks.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${task.status === "done" ? "text-white/40 line-through" : "text-white/80"}`}>
                              {task.title}
                            </span>
                            {task.confidence < 0.8 && (
                              <span className="flex items-center gap-1 text-[10px] text-amber-400/70 border border-amber-500/20 rounded px-1.5 py-0.5">
                                <Sparkles size={9} />
                                AI inferred
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <PersonChip name={task.owner_name ?? "Unassigned"} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-sm font-medium ${overdue ? "text-red-400" : urgent ? "text-amber-400" : "text-white/45"}`}>
                            {task.deadline ? formatDate(task.deadline) : "—"}
                            {overdue && <AlertCircle size={12} className="inline ml-1 mb-0.5" />}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <InlineSelect
                            value={task.status}
                            options={TASK_STATUSES}
                            colorMap={statusColors}
                            onChange={(v) => handleTaskStatusChange(task.id, v)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Decisions & Approvals</h2>
              <span className="text-xs text-white/25">{decisions.length} items</span>
            </div>

            <div className="rounded-xl border border-white/[0.07] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Description", "Decided by", "Type"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-white/25 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((d, i) => (
                    <tr key={d.id} className={`group transition-colors hover:bg-white/[0.025] ${i !== decisions.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-white/80">{d.description}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <PersonChip name={d.decided_by_name ?? "Unassigned"} />
                      </td>
                      <td className="px-4 py-3.5">
                        <InlineSelect
                          value={d.type}
                          options={DECISION_TYPES}
                          colorMap={typeColors}
                          onChange={(v) => handleDecisionTypeChange(d.id, v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
        <Upload size={20} className="text-indigo-400" />
      </div>
      <h3 className="text-base font-medium text-white/70 mb-1">No conversations uploaded yet</h3>
      <p className="text-sm text-white/30 mb-6 max-w-xs">
        Upload your first WhatsApp export or meeting transcript to get started.
      </p>
      <Link href="/upload" className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors">
        Upload now
      </Link>
    </div>
  );
}

// "use client";
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { TaskStatusBadge, DecisionTypeBadge } from "../components/StatusBadge";
// import { PersonChip } from "../components/PersonChip";
// import { listTasks, listDecisions, listConversations, type Task, type Decision } from "@/services/api";
// import {
//   CheckSquare,
//   Clock,
//   AlertCircle,
//   MessageSquare,
//   Upload,
//   Sparkles,
// } from "lucide-react";

// function isUrgent(deadline: string | null) {
//   if (!deadline) return false;
//   const diff = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
//   return diff < 2;
// }

// function isOverdue(deadline: string | null) {
//   if (!deadline) return false;
//   return new Date(deadline) < new Date();
// }

// function formatDate(dateStr: string) {
//   return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
// }

// export default function Dashboard() {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [decisions, setDecisions] = useState<Decision[]>([]);
//   const [conversationCount, setConversationCount] = useState(0);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     Promise.all([listTasks(), listDecisions(), listConversations()])
//       .then(([t, d, c]) => {
//         setTasks(t);
//         setDecisions(d);
//         setConversationCount(c.length);
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const openTasks = tasks.filter((t) => t.status !== "done").length;
//   const pendingApprovals = decisions.filter((d) => d.type === "approval_pending").length;
//   const isEmpty = !loading && tasks.length === 0 && decisions.length === 0;

//   return (
//     <div className="min-h-screen p-8 max-w-6xl mx-auto">
//       <div className="mb-8">
//         <h1 className="text-2xl font-semibold text-white/90 tracking-tight">Dashboard</h1>
//         <p className="text-sm text-white/35 mt-1">All extracted project data at a glance.</p>
//       </div>

//       <div className="grid grid-cols-3 gap-4 mb-8">
//         {[
//           { label: "Open Tasks", value: openTasks, icon: CheckSquare, color: "text-indigo-400", bg: "bg-indigo-500/8" },
//           { label: "Pending Approvals", value: pendingApprovals, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/8" },
//           { label: "Conversations Processed", value: conversationCount, icon: MessageSquare, color: "text-sky-400", bg: "bg-sky-500/8" },
//         ].map(({ label, value, icon: Icon, color, bg }) => (
//           <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 flex items-center gap-4">
//             <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
//               <Icon size={18} className={color} />
//             </div>
//             <div>
//               <div className="text-2xl font-semibold text-white/90">{value}</div>
//               <div className="text-xs text-white/35 mt-0.5">{label}</div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {loading ? (
//         <div className="text-center py-24 text-sm text-white/30">Loading…</div>
//       ) : isEmpty ? (
//         <EmptyState />
//       ) : (
//         <div className="space-y-8">
//           <section>
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Tasks</h2>
//               <span className="text-xs text-white/25">{tasks.length} items</span>
//             </div>

//             <div className="rounded-xl border border-white/[0.07] overflow-hidden">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-white/[0.06]">
//                     {["Task", "Owner", "Deadline", "Status"].map((h) => (
//                       <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-white/25 uppercase tracking-wider">
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {tasks.map((task, i) => {
//                     const urgent = isUrgent(task.deadline);
//                     const overdue = isOverdue(task.deadline);
//                     return (
//                       <tr key={task.id} className={`group transition-colors hover:bg-white/[0.025] ${i !== tasks.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
//                         <td className="px-4 py-3.5">
//                           <div className="flex items-center gap-2">
//                             <span className="text-sm text-white/80">{task.title}</span>
//                             {task.confidence < 0.8 && (
//                               <span className="flex items-center gap-1 text-[10px] text-amber-400/70 border border-amber-500/20 rounded px-1.5 py-0.5">
//                                 <Sparkles size={9} />
//                                 AI inferred
//                               </span>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-4 py-3.5">
//                           <PersonChip name={task.owner_name ?? "Unassigned"} />
//                         </td>
//                         <td className="px-4 py-3.5">
//                           <span className={`text-sm font-medium ${overdue ? "text-red-400" : urgent ? "text-amber-400" : "text-white/45"}`}>
//                             {task.deadline ? formatDate(task.deadline) : "—"}
//                             {overdue && <AlertCircle size={12} className="inline ml-1 mb-0.5" />}
//                           </span>
//                         </td>
//                         <td className="px-4 py-3.5">
//                           <TaskStatusBadge status={task.status} />
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </section>

//           <section>
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Decisions & Approvals</h2>
//               <span className="text-xs text-white/25">{decisions.length} items</span>
//             </div>

//             <div className="rounded-xl border border-white/[0.07] overflow-hidden">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-white/[0.06]">
//                     {["Description", "Decided by", "Type"].map((h) => (
//                       <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-white/25 uppercase tracking-wider">
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {decisions.map((d, i) => (
//                     <tr key={d.id} className={`group transition-colors hover:bg-white/[0.025] ${i !== decisions.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
//                       <td className="px-4 py-3.5">
//                         <span className="text-sm text-white/80">{d.description}</span>
//                       </td>
//                       <td className="px-4 py-3.5">
//                         <PersonChip name={d.decided_by_name ?? "Unassigned"} />
//                       </td>
//                       <td className="px-4 py-3.5">
//                         <DecisionTypeBadge type={d.type} />
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         </div>
//       )}
//     </div>
//   );
// }

// function EmptyState() {
//   return (
//     <div className="flex flex-col items-center justify-center py-24 text-center">
//       <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
//         <Upload size={20} className="text-indigo-400" />
//       </div>
//       <h3 className="text-base font-medium text-white/70 mb-1">No conversations uploaded yet</h3>
//       <p className="text-sm text-white/30 mb-6 max-w-xs">
//         Upload your first WhatsApp export or meeting transcript to get started.
//       </p>
//       <Link href="/upload" className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors">
//         Upload now
//       </Link>
//     </div>
//   );
// }
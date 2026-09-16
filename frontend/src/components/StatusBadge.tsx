"use client";
type TaskStatus = "open" | "in_progress" | "done" | "blocked";
type DecisionType = "decision" | "approval_pending" | "approval_granted";

const taskConfig: Record<TaskStatus, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  },
  done: {
    label: "Done",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
};

const decisionConfig: Record<DecisionType, { label: string; className: string }> = {
  decision: {
    label: "Decision",
    className: "bg-white/5 text-white/60 border border-white/10",
  },
  approval_pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  },
  approval_granted: {
    label: "Approved",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = taskConfig[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tracking-wide ${config.className}`}>
      {config.label}
    </span>
  );
}

export function DecisionTypeBadge({ type }: { type: DecisionType }) {
  const config = decisionConfig[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tracking-wide ${config.className}`}>
      {config.label}
    </span>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PersonChip } from "../components/PersonChip";
import { Sparkles, CheckCircle, ChevronDown } from "lucide-react";
import { getConversation, confirmExtraction, type Task, type Decision, type ConversationDetail } from "@/services/api";

type TaskStatus = "open" | "in_progress" | "done" | "blocked";
type DecisionType = "decision" | "approval_pending" | "approval_granted";

export default function Review() {
  const router = useRouter();
  const params = useParams<{ conversationId: string }>();
  const conversationId = params?.conversationId;
  if (!conversationId) {
  return <div className="min-h-screen flex items-center justify-center text-sm text-white/30">Invalid conversation link.</div>;
  }
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    getConversation(conversationId)
      .then((data) => {
        setConversation(data);
        setTasks(data.tasks);
        setDecisions(data.decisions);
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  function updateTask(id: string, field: string, value: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }

  function updateDecision(id: string, field: string, value: string) {
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  async function handleConfirm() {
    if (!conversationId) return;
    setSaving(true);
    try {
      await confirmExtraction(conversationId, { tasks, decisions });
      setSaved(true);
      await new Promise((r) => setTimeout(r, 800));
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-white/30">Loading…</div>;
  }

  if (!conversation) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-white/30">Conversation not found.</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-xs text-white/30 mb-1 uppercase tracking-wider">Review Extraction</div>
        <h1 className="text-2xl font-semibold text-white/90 tracking-tight">{conversation.title}</h1>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 mb-8 flex gap-3">
        <Sparkles size={16} className="text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <div className="text-xs font-medium text-indigo-300/70 uppercase tracking-wider mb-1">AI Summary</div>
          <p className="text-sm text-white/70 leading-relaxed">{conversation.summary}</p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Tasks</h2>
          <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
            {tasks.map((task) => (
              <div key={task.id} className="grid grid-cols-[1fr_160px_120px_120px] gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors">
                <input
                  value={task.title}
                  onChange={(e) => updateTask(task.id, "title", e.target.value)}
                  className="text-sm text-white/80 bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500/50 focus:outline-none py-0.5 transition-colors w-full"
                />
                <PersonChip name={task.owner_name ?? "Unassigned"} />
                <input
                  type="date"
                  value={task.deadline ?? ""}
                  onChange={(e) => updateTask(task.id, "deadline", e.target.value)}
                  className="text-xs text-white/50 bg-transparent border border-white/8 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500/50 transition-colors [color-scheme:dark]"
                />
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={task.status}
                      onChange={(e) => updateTask(task.id, "status", e.target.value)}
                      className="text-xs bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white/60 focus:outline-none focus:border-indigo-500/50 appearance-none pr-5 transition-colors cursor-pointer"
                    >
                      {(["open", "in_progress", "done", "blocked"] as TaskStatus[]).map((s) => (
                        <option key={s} value={s} className="bg-[#1a1a24]">
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                  {task.confidence < 0.8 && (
                    <span title={`Confidence: ${Math.round(task.confidence * 100)}%`}>
                      <Sparkles size={12} className="text-amber-400/60" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Decisions</h2>
          <div className="rounded-xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.04]">
            {decisions.map((d) => (
              <div key={d.id} className="grid grid-cols-[1fr_160px_160px] gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors">
                <input
                  value={d.description}
                  onChange={(e) => updateDecision(d.id, "description", e.target.value)}
                  className="text-sm text-white/80 bg-transparent border-b border-transparent hover:border-white/10 focus:border-indigo-500/50 focus:outline-none py-0.5 transition-colors w-full"
                />
                <PersonChip name={d.decided_by_name ?? "Unassigned"} />
                <div className="relative">
                  <select
                    value={d.type}
                    onChange={(e) => updateDecision(d.id, "type", e.target.value)}
                    className="text-xs bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white/60 focus:outline-none focus:border-indigo-500/50 appearance-none pr-5 transition-colors cursor-pointer w-full"
                  >
                    {(["decision", "approval_pending", "approval_granted"] as DecisionType[]).map((t) => (
                      <option key={t} value={t} className="bg-[#1a1a24]">
                        {t.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end pt-2 pb-8">
          <button
            onClick={handleConfirm}
            disabled={saving || saved}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              saved ? "bg-emerald-500 text-white" : "bg-indigo-500 hover:bg-indigo-400 text-white"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle size={15} />
                Saved
              </>
            ) : saving ? (
              "Saving…"
            ) : (
              "Confirm & Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
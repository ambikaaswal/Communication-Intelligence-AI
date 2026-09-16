"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, FileText, MessageCircle, FileType, CheckCircle } from "lucide-react";
import { uploadConversation } from "@/services/api";

type SourceType = "whatsapp" | "transcript" | "notes";
type Stage = "idle" | "reading" | "extracting" | "done" | "error";

const sourceOptions: { value: SourceType; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: "whatsapp", label: "WhatsApp Export", icon: <MessageCircle size={16} />, hint: ".txt file exported from WhatsApp" },
  { value: "transcript", label: "Meeting Transcript", icon: <FileText size={16} />, hint: ".docx or .txt transcript" },
  { value: "notes", label: "Notes", icon: <FileType size={16} />, hint: "Any structured notes or minutes" },
];

const stageMessages: Record<Stage, string> = {
  idle: "",
  reading: "Reading conversation…",
  extracting: "Extracting tasks and decisions…",
  done: "Extraction complete",
  error: "Something went wrong",
};

export default function Upload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("whatsapp");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setError(null);
    setStage("reading");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sourceType", sourceType);
    formData.append("title", title || file.name);

    try {
      setStage("extracting");
      const result = await uploadConversation(formData);
      setStage("done");
      await new Promise((r) => setTimeout(r, 500));
      router.push(`/review/${result.conversationId}`);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const loading = stage === "reading" || stage === "extracting";
  const done = stage === "done";

  return (
    <div className="min-h-screen flex items-start justify-center p-8 pt-16">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white/90 tracking-tight">Upload Conversation</h1>
          <p className="text-sm text-white/35 mt-1">
            Upload a chat export or transcript to extract tasks and decisions.
          </p>
        </div>

        <div className="space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center py-12 gap-3 ${
              dragging
                ? "border-indigo-500/60 bg-indigo-500/5"
                : file
                ? "border-emerald-500/40 bg-emerald-500/5 cursor-default"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.docx"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />

            {file ? (
              <>
                <CheckCircle size={28} className="text-emerald-400" />
                <p className="text-sm font-medium text-white/80">{file.name}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <UploadIcon size={18} className="text-white/40" />
                </div>
                <p className="text-sm text-white/50">
                  Drag & drop or{" "}
                  <span className="text-indigo-400 underline underline-offset-2">browse</span>
                </p>
                <p className="text-xs text-white/20">.txt or .docx accepted</p>
              </>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
              Source Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sourceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSourceType(opt.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                    sourceType === opt.value
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                      : "border-white/8 bg-white/[0.02] text-white/40 hover:text-white/60 hover:border-white/15"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
              Title <span className="normal-case text-white/20">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Site meeting — Sep 12"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            disabled={!file || loading}
            onClick={handleSubmit}
            className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              done
                ? "bg-emerald-500 text-white"
                : !file || loading
                ? "bg-indigo-500/30 text-white/30 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-400 text-white"
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                {stageMessages[stage]}
              </>
            ) : done ? (
              <>{stageMessages.done}</>
            ) : (
              "Upload & Extract"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export interface Task {
  id: string;
  title: string;
  owner_id?: string | null;
  owner_name?: string | null;
  deadline: string | null;
  status: 'open' | 'in_progress' | 'done' | 'blocked';
  confidence: number;
  confirmed: boolean;
}

export interface Decision {
  id: string;
  description: string;
  decided_by?: string | null;
  decided_by_name?: string | null;
  type: 'decision' | 'approval_pending' | 'approval_granted';
  confirmed: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  source_type: 'whatsapp' | 'transcript' | 'notes';
  summary: string;
  uploaded_at: string;
}

export interface ConversationDetail extends ConversationSummary {
  raw_text: string;
  tasks: Task[];
  decisions: Decision[];
}

export interface UploadResult {
  conversationId: string;
  summary: string;
  tasks: Task[];
  decisions: Decision[];
  peopleMentioned: string[];
}

export interface SearchResults {
  tasks: { id: string; title: string; status: Task['status']; deadline: string | null; owner_name?: string | null }[];
  decisions: { id: string; title: string; type: Decision['type']; decided_by_name?: string | null }[];
  conversations: { id: string; title: string; summary: string }[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function uploadConversation(formData: FormData): Promise<UploadResult> {
  return request('/conversations/upload', { method: 'POST', body: formData });
}

export function getConversation(id: string): Promise<ConversationDetail> {
  return request(`/conversations/${id}`);
}

export function listConversations(): Promise<ConversationSummary[]> {
  return request('/conversations');
}

export function confirmExtraction(
  id: string,
  payload: { tasks: Partial<Task>[]; decisions: Partial<Decision>[] }
): Promise<{ conversationId: string; status: string }> {
  return request(`/conversations/${id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function listTasks(params?: Record<string, string>): Promise<Task[]> {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  return request(`/tasks${qs}`);
}

export function updateTask(id: string, payload: Partial<Task>): Promise<Task> {
  return request(`/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function listDecisions(params?: Record<string, string>): Promise<Decision[]> {
  const qs = params ? `?${new URLSearchParams(params)}` : '';
  return request(`/decisions${qs}`);
}

export function updateDecision(id: string, payload: Partial<Decision>): Promise<Decision> {
  return request(`/decisions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function searchAll(q: string): Promise<SearchResults> {
  return request(`/search?q=${encodeURIComponent(q)}`);
}
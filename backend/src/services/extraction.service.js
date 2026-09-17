
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildSystemPrompt(referenceDate) {
  return `You are a project communication extraction engine for architecture/interior design/construction projects.
Given a raw conversation (WhatsApp export or meeting transcript), extract structured project information.

The reference date for this conversation is ${referenceDate} (YYYY-MM-DD). Use it to resolve any relative
date language ("by tomorrow evening", "by Thursday", "by this weekend", "next week", etc.) into an actual
calendar date. Weekdays refer to the closest upcoming occurrence of that day on or after the reference date.

Return ONLY valid JSON, no preamble, no markdown fences, matching this exact shape:

{
  "summary": "2-3 sentence summary of the conversation",
  "tasks": [
    { "title": "string", "owner": "person name or null", "deadline": "YYYY-MM-DD or null", "confidence": 0.0-1.0 }
  ],
  "decisions": [
    { "description": "string", "type": "decision | approval_pending | approval_granted", "decided_by": "person name or null", "confidence": 0.0-1.0 }
  ],
  "people_mentioned": ["name1", "name2"]
}

Rules:
- Only extract tasks/decisions that are clearly stated or strongly implied, not speculative.
- Resolve every relative deadline mention into an actual YYYY-MM-DD date using the reference date above.
  Keep the task title clean and human-readable (e.g. "Update BOQ with marble selection") rather than
  repeating the deadline phrase in the title, since the date now lives in the deadline field.
- If no deadline is mentioned at all, deadline should be null.
- confidence reflects how certain you are this is a real actionable item (1.0 = explicit, 0.5 = inferred).
- Do not invent people, tasks, or dates not present in the text.`;
}

export async function extractFromText(rawText, referenceDate = new Date().toISOString().slice(0, 10)) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: buildSystemPrompt(referenceDate),
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(rawText);
  const responseText = result.response.text();
  const cleaned = responseText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Failed to parse LLM extraction output as JSON: ' + err.message);
  }
}
// import { readFileSync } from 'fs';
// import mammoth from 'mammoth';

// export async function parseUploadedFile(filePath, mimetype, originalName) {
//   if (originalName.endsWith('.docx')) {
//     const result = await mammoth.extractRawText({ path: filePath });
//     return result.value;
//   }

//   // .txt (WhatsApp export or plain transcript)
//   return readFileSync(filePath, 'utf-8');
// }

// // Basic WhatsApp export line format: "12/09/26, 10:04 AM - Name: message"
// // Kept here so extraction prompt gets cleaner speaker-tagged text if needed later.
// export function normalizeWhatsappExport(rawText) {
//   return rawText
//     .split('\n')
//     .filter((line) => line.trim().length > 0)
//     .join('\n');
// }
import { readFileSync } from 'fs';
import mammoth from 'mammoth';

export async function parseUploadedFile(filePath, mimetype, originalName) {
  if (originalName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  return readFileSync(filePath, 'utf-8');
}

export function normalizeWhatsappExport(rawText) {
  return rawText
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

export function extractReferenceDateFromText(rawText) {
  const match = rawText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/m);
  if (!match) return null;

  let [, day, month, year] = match;
  if (year.length === 2) year = `20${year}`;

  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return isNaN(new Date(iso).getTime()) ? null : iso;
}
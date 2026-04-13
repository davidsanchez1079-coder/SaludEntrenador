/**
 * Limpia backticks de markdown (```json ... ```) y parsea JSON.
 * Si no es JSON valido, retorna null.
 */
export function cleanAndParseJSON(text) {
  if (!text || typeof text !== 'string') return null;
  let cleaned = text.trim();
  // Quitar ```json y ``` o ``` al inicio/final
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Extrae texto legible de una respuesta que puede ser JSON crudo o texto plano.
 * Busca el campo 'respuesta' o 'feedback' o 'resumen' dentro del JSON.
 */
export function extractReadableText(text, ...fields) {
  if (!text || typeof text !== 'string') return text || '';
  const parsed = cleanAndParseJSON(text);
  if (parsed) {
    for (const field of fields) {
      if (parsed[field]) return parsed[field];
    }
  }
  // Si no es JSON o no tiene los campos, devolver texto limpio de backticks
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

const API_BASE = 'http://localhost:8080/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  console.log('[API]', config.method || 'GET', url);
  if (config.body) console.log('[API] Body:', config.body);
  const res = await fetch(url, config);
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error('[API] Error', res.status, res.statusText, errorBody);
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  console.log('[API] Response:', JSON.stringify(data).substring(0, 500));
  return data;
}

// ---- Usuarios ----
export const getUsuario = (id) => request(`/usuarios/${id}`);
export const updateUsuario = (id, data) =>
  request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const createUsuario = (data) =>
  request('/usuarios', { method: 'POST', body: JSON.stringify(data) });

// ---- Salud ----
export const chatSalud = (usuarioId, mensaje) =>
  request(`/salud/${usuarioId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ mensaje }),
  });
export const getHistorialSalud = (usuarioId, categoria) => {
  const params = categoria ? `?categoria=${categoria}` : '';
  return request(`/salud/${usuarioId}/historial${params}`);
};
export const getResumenSalud = (usuarioId) =>
  request(`/salud/${usuarioId}/resumen`);

// ---- Entrenador ----
export const chatEntrenador = (usuarioId, mensaje) =>
  request(`/entrenador/${usuarioId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ mensaje }),
  });
export const guardarWorkout = (usuarioId, workout) =>
  request(`/entrenador/${usuarioId}/workout`, {
    method: 'POST',
    body: JSON.stringify(workout),
  });
export const getHistorialEntrenador = (usuarioId) =>
  request(`/entrenador/${usuarioId}/historial`);
export const feedbackSerie = (usuarioId, datos) =>
  request(`/entrenador/${usuarioId}/feedback-serie`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
export const resumenSesion = (usuarioId, datos) =>
  request(`/entrenador/${usuarioId}/resumen-sesion`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });

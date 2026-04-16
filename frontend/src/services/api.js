const API_BASE = import.meta.env.VITE_API_URL || 'https://saludentrenador-production.up.railway.app';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function getUsuario(usuarioId) {
  return request(`/api/usuarios/${usuarioId}`);
}

export function getUsuarioPorCorreo(correo) {
  return request(`/api/usuarios/por-correo?correo=${encodeURIComponent(correo)}`);
}

export function createUsuario(payload) {
  return request('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUsuario(usuarioId, payload) {
  return request(`/api/usuarios/${usuarioId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function chatSalud(usuarioId, mensaje) {
  return request(`/api/salud/${usuarioId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ mensaje }),
  });
}

export function getHistorialSalud(usuarioId, categoria) {
  const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
  return request(`/api/salud/${usuarioId}/historial${query}`);
}

export function getResumenSalud(usuarioId) {
  return request(`/api/salud/${usuarioId}/resumen`);
}

export function chatEntrenador(usuarioId, mensaje) {
  return request(`/api/entrenador/${usuarioId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ mensaje }),
  });
}

export function feedbackSerie(usuarioId, payload) {
  return request(`/api/entrenador/${usuarioId}/feedback-serie`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resumenSesion(usuarioId, payload) {
  return request(`/api/entrenador/${usuarioId}/resumen-sesion`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function guardarWorkout(usuarioId, payload) {
  return request(`/api/entrenador/${usuarioId}/workout`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getHistorialEntrenador(usuarioId) {
  return request(`/api/entrenador/${usuarioId}/historial`);
}

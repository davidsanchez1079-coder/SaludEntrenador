import { useState, useEffect } from 'react';
import { getHistorialEntrenador } from '../services/api';

const s = {
  card: { background: '#111916', border: '1px solid #1e2d27', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  name: { fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa' },
  date: { fontSize: '0.75rem', color: '#64748b' },
  status: { display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 },
  completed: { background: '#052e16', color: '#4ade80' },
  incomplete: { background: '#1c1517', color: '#f87171' },
  empty: { textAlign: 'center', padding: '3rem', color: '#64748b' },
};

export default function EntrenadorHistorial({ usuarioId }) {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    getHistorialEntrenador(usuarioId).then(setWorkouts).catch(() => setWorkouts([]));
  }, [usuarioId]);

  if (workouts.length === 0) {
    return <div style={s.empty}><p>No hay entrenamientos completados aun.</p></div>;
  }

  return (
    <div>
      {workouts.map((w) => (
        <div key={w.id} style={s.card}>
          <div style={s.header}>
            <span style={s.name}>{'\u{1F3CB}'} {w.nombreRutina}</span>
            <span style={s.date}>{w.fecha ? new Date(w.fecha).toLocaleDateString() : ''}</span>
          </div>
          <span style={{ ...s.status, ...(w.completado ? s.completed : s.incomplete) }}>
            {w.completado ? 'Completado' : 'Incompleto'}
          </span>
        </div>
      ))}
    </div>
  );
}

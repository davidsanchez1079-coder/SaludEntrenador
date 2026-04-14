import { useState, useEffect } from 'react';
import { getHistorialEntrenador } from '../services/api';

const s = {
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  name: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  date: { fontSize: '0.75rem', color: 'var(--text-dim)' },
  status: { display: 'inline-block', padding: '2px 8px', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  completed: { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' },
  incomplete: { background: 'var(--border)', color: 'var(--text-dim)' },
  empty: { textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' },
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

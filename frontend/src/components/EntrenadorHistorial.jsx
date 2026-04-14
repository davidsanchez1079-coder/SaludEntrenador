import { useState, useEffect } from 'react';
import { getHistorialEntrenador } from '../services/api';

const s = {
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: '3px solid #E53E3E', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  name: { fontSize: '0.95rem', fontWeight: 800, color: '#E53E3E', textTransform: 'uppercase', letterSpacing: '0.5px' },
  date: { fontSize: '0.75rem', color: '#666' },
  status: { display: 'inline-block', padding: '2px 8px', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  completed: { background: 'rgba(229,62,62,0.15)', color: '#E53E3E', border: '1px solid rgba(229,62,62,0.3)' },
  incomplete: { background: '#2a2a2a', color: '#888' },
  empty: { textAlign: 'center', padding: '3rem', color: '#666' },
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

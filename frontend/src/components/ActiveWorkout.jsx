import { useState } from 'react';
import { guardarWorkout } from '../services/api';

const s = {
  container: { background: '#111916', border: '1px solid #1e2d27', borderRadius: '12px', padding: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' },
  exerciseName: { fontSize: '1rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.75rem' },
  setRow: { display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' },
  setLabel: { fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 },
  input: { padding: '0.5rem', background: '#0a0f0d', border: '1px solid #2d3a35', borderRadius: '6px', color: '#e0e0e0', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', outline: 'none' },
  nav: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '0.5rem' },
  btn: { padding: '0.6rem 1.5rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' },
  progress: { fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '1rem' },
};

export default function ActiveWorkout({ rutina, usuarioId, onFinish }) {
  const ejercicios = rutina.ejercicios || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [logs, setLogs] = useState(
    ejercicios.map((ej) =>
      Array.from({ length: ej.series || 3 }, () => ({ peso: '', reps: '' }))
    )
  );
  const [saving, setSaving] = useState(false);

  const current = ejercicios[currentIdx];
  const currentLogs = logs[currentIdx] || [];

  const updateSet = (setIdx, field, value) => {
    const newLogs = [...logs];
    newLogs[currentIdx] = [...newLogs[currentIdx]];
    newLogs[currentIdx][setIdx] = { ...newLogs[currentIdx][setIdx], [field]: value };
    setLogs(newLogs);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await guardarWorkout(usuarioId, {
        nombreRutina: rutina.nombre,
        ejerciciosLog: JSON.stringify(logs),
        completado: true,
      });
      onFinish();
    } catch {
      alert('Error guardando entrenamiento');
    }
    setSaving(false);
  };

  if (!current) return null;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.title}>{'\u{1F3CB}'} {rutina.nombre}</span>
        <button onClick={onFinish} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.2rem' }}>{'\u2716'}</button>
      </div>
      <div style={s.progress}>
        Ejercicio {currentIdx + 1} de {ejercicios.length}
      </div>
      <div style={s.exerciseName}>{current.nombre}</div>
      <div style={{ ...s.setRow, marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>SET</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>PESO (kg)</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>REPS</span>
      </div>
      {currentLogs.map((set, i) => (
        <div key={i} style={s.setRow}>
          <span style={s.setLabel}>#{i + 1}</span>
          <input style={s.input} type="number" placeholder="0" value={set.peso} onChange={(e) => updateSet(i, 'peso', e.target.value)} />
          <input style={s.input} type="number" placeholder={String(current.repeticiones || 10)} value={set.reps} onChange={(e) => updateSet(i, 'reps', e.target.value)} />
        </div>
      ))}
      {current.notas && <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.75rem' }}>{'\u{1F4A1}'} {current.notas}</div>}
      <div style={s.nav}>
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((p) => p - 1)}
          style={{ ...s.btn, background: '#1e2d27', color: '#94a3b8', opacity: currentIdx === 0 ? 0.4 : 1 }}
        >
          Anterior
        </button>
        {currentIdx < ejercicios.length - 1 ? (
          <button onClick={() => setCurrentIdx((p) => p + 1)} style={{ ...s.btn, background: '#60a5fa', color: '#0a0f0d' }}>
            Siguiente
          </button>
        ) : (
          <button onClick={handleFinish} disabled={saving} style={{ ...s.btn, background: '#4ade80', color: '#0a0f0d' }}>
            {saving ? 'Guardando...' : 'Terminar'}
          </button>
        )}
      </div>
    </div>
  );
}

const s = {
  card: { background: '#111c2e', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  title: { fontSize: '1rem', fontWeight: 700, color: '#60a5fa' },
  duration: { fontSize: '0.8rem', color: '#94a3b8' },
  exercise: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid #1e2d40', fontSize: '0.85rem', alignItems: 'center' },
  exHeader: { fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' },
  name: { color: '#e0e0e0', fontWeight: 600 },
  value: { color: '#94a3b8', textAlign: 'center' },
  btn: { marginTop: '0.75rem', width: '100%', padding: '0.6rem', background: '#60a5fa', color: '#0a0f0d', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};

export default function RoutineCard({ rutina, onStart }) {
  if (!rutina || !rutina.ejercicios) return null;
  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>{'\u{1F4CB}'} {rutina.nombre}</span>
        {rutina.duracion_minutos && <span style={s.duration}>{rutina.duracion_minutos} min</span>}
      </div>
      <div style={s.exercise}>
        <span style={s.exHeader}>Ejercicio</span>
        <span style={{ ...s.exHeader, textAlign: 'center' }}>Series</span>
        <span style={{ ...s.exHeader, textAlign: 'center' }}>Reps</span>
        <span style={{ ...s.exHeader, textAlign: 'center' }}>Desc.</span>
      </div>
      {rutina.ejercicios.map((ej, i) => (
        <div key={i} style={s.exercise}>
          <span style={s.name}>{ej.nombre}</span>
          <span style={s.value}>{ej.series}</span>
          <span style={s.value}>{ej.repeticiones}</span>
          <span style={s.value}>{ej.descanso_seg}s</span>
        </div>
      ))}
      {onStart && (
        <button style={s.btn} onClick={onStart}>{'\u{1F3AF}'} Iniciar Entrenamiento</button>
      )}
    </div>
  );
}

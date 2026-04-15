const s = {
  card: { background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)", borderRadius: "6px", padding: "1rem", marginBottom: "0.75rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" },
  title: { fontSize: "1rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.5px" },
  dayTitle: { fontSize: "0.85rem", fontWeight: 700, color: "var(--text)", margin: "0.75rem 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" },
  duration: { fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 600 },
  exercise: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.85rem", alignItems: "center" },
  exHeader: { fontSize: "0.65rem", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" },
  name: { color: "var(--text)", fontWeight: 600 },
  value: { color: "var(--text-dim)", textAlign: "center" },
  btn: { marginTop: "0.75rem", width: "100%", padding: "0.7rem", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "1px" },
};

function normalizeExercise(ej) {
  return {
    nombre: ej?.nombre || ej?.ejercicio || ej?.name || 'Ejercicio',
    series: ej?.series || ej?.sets || ej?.set || '-',
    repeticiones: ej?.repeticiones || ej?.reps || ej?.repeticiones_objetivo || '-',
    descanso_seg: ej?.descanso_seg || ej?.descanso || ej?.rest || '-',
  };
}

function normalizeRoutine(input) {
  if (!input || typeof input !== 'object') return null;

  const rutina = input.rutina && typeof input.rutina === 'object' ? input.rutina : input;
  const dias = rutina.dias || rutina.plan || rutina.semanal || rutina.workout_days;
  const ejercicios = rutina.ejercicios || rutina.exercises || rutina.workout;

  if (Array.isArray(dias)) {
    return {
      nombre: rutina.nombre || rutina.titulo || rutina.nombre_rutina || 'Plan de Entrenamiento',
      dias: dias.map((dia, i) => ({
        nombre: dia?.nombre || dia?.dia || dia?.titulo || `Día ${i + 1}`,
        duracion_minutos: dia?.duracion_minutos || dia?.duracion || dia?.duration_minutes || null,
        ejercicios: Array.isArray(dia?.ejercicios || dia?.exercises) ? (dia.ejercicios || dia.exercises).map(normalizeExercise) : [],
      })),
    };
  }

  if (Array.isArray(ejercicios)) {
    return {
      nombre: rutina.nombre || rutina.titulo || rutina.nombre_rutina || 'Rutina',
      duracion_minutos: rutina.duracion_minutos || rutina.duracion || rutina.duration_minutes || null,
      ejercicios: ejercicios.map(normalizeExercise),
    };
  }

  return null;
}

function EjerciciosList({ ejercicios }) {
  if (!ejercicios || ejercicios.length === 0) return null;
  return (
    <>
      <div style={s.exercise}>
        <span style={s.exHeader}>Ejercicio</span>
        <span style={{ ...s.exHeader, textAlign: "center" }}>Series</span>
        <span style={{ ...s.exHeader, textAlign: "center" }}>Reps</span>
        <span style={{ ...s.exHeader, textAlign: "center" }}>Desc.</span>
      </div>
      {ejercicios.map((ej, i) => (
        <div key={i} style={s.exercise}>
          <span style={s.name}>{ej.nombre}</span>
          <span style={s.value}>{ej.series}</span>
          <span style={s.value}>{ej.repeticiones}</span>
          <span style={s.value}>{String(ej.descanso_seg).includes('s') ? ej.descanso_seg : `${ej.descanso_seg}s`}</span>
        </div>
      ))}
    </>
  );
}

export default function RoutineCard({ rutina, onStart }) {
  const normalized = normalizeRoutine(rutina);
  if (!normalized) return null;

  if (normalized.dias && Array.isArray(normalized.dias)) {
    return (
      <div style={s.card}>
        <div style={s.header}>
          <span style={s.title}>📋 {normalized.nombre}</span>
          <span style={s.duration}>{normalized.dias.length} DÍAS</span>
        </div>
        {normalized.dias.map((dia, i) => (
          <div key={i}>
            <div style={s.dayTitle}>🏋️ {dia.nombre} {dia.duracion_minutos ? `· ${dia.duracion_minutos} min` : ""}</div>
            <EjerciciosList ejercicios={dia.ejercicios} />
          </div>
        ))}
        {onStart && <button style={s.btn} onClick={() => onStart(normalized)}>🔥 Iniciar Entrenamiento</button>}
      </div>
    );
  }

  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>📋 {normalized.nombre}</span>
        {normalized.duracion_minutos && <span style={s.duration}>{normalized.duracion_minutos} MIN</span>}
      </div>
      <EjerciciosList ejercicios={normalized.ejercicios} />
      {onStart && <button style={s.btn} onClick={() => onStart(normalized)}>🔥 Iniciar Entrenamiento</button>}
    </div>
  );
}

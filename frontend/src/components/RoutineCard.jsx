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
          <span style={s.value}>{ej.descanso_seg}s</span>
        </div>
      ))}
    </>
  );
}

export default function RoutineCard({ rutina, onStart }) {
  if (!rutina) return null;

  // Rutina con multiples dias
  if (rutina.dias && Array.isArray(rutina.dias)) {
    return (
      <div style={s.card}>
        <div style={s.header}>
          <span style={s.title}>📋 {rutina.nombre || "Plan de Entrenamiento"}</span>
          <span style={s.duration}>{rutina.dias.length} DÍAS</span>
        </div>
        {rutina.dias.map((dia, i) => (
          <div key={i}>
            <div style={s.dayTitle}>🏋️ {dia.nombre || `Día ${i + 1}`} {dia.duracion_minutos ? `· ${dia.duracion_minutos} min` : ""}</div>
            <EjerciciosList ejercicios={dia.ejercicios} />
          </div>
        ))}
        {onStart && <button style={s.btn} onClick={onStart}>🔥 Iniciar Entrenamiento</button>}
      </div>
    );
  }

  // Rutina simple con ejercicios directos
  if (!rutina.ejercicios) return null;
  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>📋 {rutina.nombre}</span>
        {rutina.duracion_minutos && <span style={s.duration}>{rutina.duracion_minutos} MIN</span>}
      </div>
      <EjerciciosList ejercicios={rutina.ejercicios} />
      {onStart && <button style={s.btn} onClick={onStart}>🔥 Iniciar Entrenamiento</button>}
    </div>
  );
}

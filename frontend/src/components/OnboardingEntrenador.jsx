import { useState } from "react";

const GRUPOS_MUSCULARES = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
  "Abdomen", "Glúteos", "Cuádriceps", "Isquiotibiales",
  "Pantorrillas", "Trapecio", "Antebrazos"
];

const TIEMPO_OPCIONES = [
  "30 minutos", "45 minutos", "60 minutos", "75 minutos", "90 minutos", "Más de 90 minutos"
];

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" },
  modal: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.5rem", maxWidth: "500px", width: "100%", maxHeight: "92vh", overflowY: "auto" },
  title: { fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" },
  subtitle: { fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1.5rem" },
  label: { fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem", display: "block" },
  sublabel: { fontSize: "0.7rem", color: "var(--text-dim)", marginBottom: "0.5rem", fontStyle: "italic" },
  select: { width: "100%", padding: "0.6rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "0.9rem", marginBottom: "1rem", fontFamily: "inherit" },
  input: { width: "100%", padding: "0.6rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "0.9rem", marginBottom: "1rem", fontFamily: "inherit", boxSizing: "border-box" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.75rem" },
  chip: (tipo) => ({
    padding: "0.5rem 0.75rem", borderRadius: "6px", cursor: "pointer", textAlign: "center", fontSize: "0.8rem", transition: "all 0.15s",
    ...(tipo === "priority"
      ? { border: "2px solid var(--accent)", background: "rgba(220,50,47,0.2)", color: "var(--accent)", fontWeight: 700 }
      : tipo === "secondary"
      ? { border: "2px solid #4DC9C2", background: "rgba(77,201,194,0.15)", color: "#4DC9C2", fontWeight: 600 }
      : { border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-dim)", fontWeight: 400 })
  }),
  legend: { display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.72rem" },
  legendDot: (color) => ({ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", marginRight: 4 }),
  btn: { width: "100%", padding: "0.85rem", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "1px", marginTop: "0.5rem" },
  section: { marginBottom: "1.25rem" },
  hint: { fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.3rem" },
};

export default function OnboardingEntrenador({ onComplete }) {
  const [dias, setDias] = useState("3");
  const [experiencia, setExperiencia] = useState("Intermedio");
  const [objetivo, setObjetivo] = useState("Ganar músculo");
  const [grupos, setGrupos] = useState({}); // { nombre: "priority" | "secondary" | undefined }
  const [tiempo, setTiempo] = useState("60 minutos");
  const [otro, setOtro] = useState("");

  const toggleGrupo = (g) => {
    setGrupos(prev => {
      const estado = prev[g];
      if (!estado) return { ...prev, [g]: "priority" };
      if (estado === "priority") return { ...prev, [g]: "secondary" };
      const next = { ...prev };
      delete next[g];
      return next;
    });
  };

  const prioritarios = Object.entries(grupos).filter(([,v]) => v === "priority").map(([k]) => k);
  const secundarios = Object.entries(grupos).filter(([,v]) => v === "secondary").map(([k]) => k);

  const handleGenerar = () => {
    if (prioritarios.length === 0) { alert("Selecciona al menos un grupo prioritario (1er toque = rojo)"); return; }
    const prompt = [
      `Genera un plan de entrenamiento completo de ${dias} días a la semana.`,
      `Nivel: ${experiencia}. Objetivo: ${objetivo}. Tiempo por sesión: ${tiempo}.`,
      `GRUPOS PRIORITARIOS (máximo volumen y ejercicios): ${prioritarios.join(", ")}.`,
      secundarios.length ? `Grupos secundarios (trabajar como complemento): ${secundarios.join(", ")}.` : "",
      `MÍNIMO 8-10 ejercicios por día. Genera TODOS los días del plan completos.`,
      otro ? `Notas adicionales: ${otro}.` : ""
    ].filter(Boolean).join(" ");
    onComplete(prompt);
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.title}>🏋️ Configura tu Plan</div>
        <div style={s.subtitle}>Responde estas preguntas para generar tu rutina personalizada</div>

        <div style={s.section}>
          <label style={s.label}>¿Cuántos días entrenas a la semana?</label>
          <select style={s.select} value={dias} onChange={e => setDias(e.target.value)}>
            {["2","3","4","5","6"].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div style={s.section}>
          <label style={s.label}>Nivel de experiencia</label>
          <select style={s.select} value={experiencia} onChange={e => setExperiencia(e.target.value)}>
            {["Principiante","Intermedio","Avanzado"].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>

        <div style={s.section}>
          <label style={s.label}>Objetivo principal</label>
          <select style={s.select} value={objetivo} onChange={e => setObjetivo(e.target.value)}>
            {["Ganar músculo","Bajar grasa","Fuerza","Resistencia","Tonificar","Rehabilitación"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div style={s.section}>
          <label style={s.label}>Grupos musculares</label>
          <div style={s.legend}>
            <span><span style={s.legendDot("#dc322f")} />1er toque = Prioritario (más volumen)</span>
            <span><span style={s.legendDot("#4DC9C2")} />2do toque = Secundario</span>
            <span>3er toque = Quitar</span>
          </div>
          <div style={s.grid}>
            {GRUPOS_MUSCULARES.map(g => (
              <div key={g} style={s.chip(grupos[g])} onClick={() => toggleGrupo(g)}>
                {grupos[g] === "priority" ? "🔴 " : grupos[g] === "secondary" ? "🔵 " : ""}{g}
              </div>
            ))}
          </div>
          {prioritarios.length > 0 && (
            <div style={s.hint}>
              🔴 Prioritarios: {prioritarios.join(", ")}
              {secundarios.length > 0 && <> &nbsp;|&nbsp; 🔵 Secundarios: {secundarios.join(", ")}</>}
            </div>
          )}
        </div>

        <div style={s.section}>
          <label style={s.label}>Tiempo disponible por sesión</label>
          <select style={s.select} value={tiempo} onChange={e => setTiempo(e.target.value)}>
            {TIEMPO_OPCIONES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={s.section}>
          <label style={s.label}>Algo más que deba saber</label>
          <input
            style={s.input}
            type="text"
            placeholder="Lesiones, equipo disponible, preferencias..."
            value={otro}
            onChange={e => setOtro(e.target.value)}
          />
        </div>

        <button style={s.btn} onClick={handleGenerar}>🔥 Generar mi Plan</button>
      </div>
    </div>
  );
}

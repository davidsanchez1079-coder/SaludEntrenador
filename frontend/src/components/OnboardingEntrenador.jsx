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
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" },
  modal: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.5rem", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" },
  title: { fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" },
  subtitle: { fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1.5rem" },
  label: { fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem", display: "block" },
  select: { width: "100%", padding: "0.6rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "0.9rem", marginBottom: "1rem", fontFamily: "inherit" },
  input: { width: "100%", padding: "0.6rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", fontSize: "0.9rem", marginBottom: "1rem", fontFamily: "inherit", boxSizing: "border-box" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "1rem" },
  chip: (sel) => ({ padding: "0.5rem 0.75rem", borderRadius: "6px", border: sel ? "2px solid var(--accent)" : "1px solid var(--border)", background: sel ? "rgba(220,50,47,0.15)" : "var(--bg)", color: sel ? "var(--accent)" : "var(--text-dim)", fontSize: "0.8rem", fontWeight: sel ? 700 : 400, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }),
  btn: { width: "100%", padding: "0.85rem", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "1px", marginTop: "0.5rem" },
  section: { marginBottom: "1.25rem" },
};

export default function OnboardingEntrenador({ onComplete }) {
  const [dias, setDias] = useState("3");
  const [experiencia, setExperiencia] = useState("Intermedio");
  const [objetivo, setObjetivo] = useState("Ganar músculo");
  const [grupos, setGrupos] = useState([]);
  const [tiempo, setTiempo] = useState("60 minutos");
  const [otro, setOtro] = useState("");

  const toggleGrupo = (g) => setGrupos(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleGenerar = () => {
    if (grupos.length === 0) { alert("Selecciona al menos un grupo muscular"); return; }
    const resumen = [
      `Días de entrenamiento: ${dias} días a la semana`,
      `Experiencia: ${experiencia}`,
      `Objetivo: ${objetivo}`,
      `Grupos musculares prioritarios: ${grupos.join(", ")}`,
      `Tiempo disponible: ${tiempo}`,
      otro ? `Notas adicionales: ${otro}` : ""
    ].filter(Boolean).join(". ");

    const prompt = `Genera un plan de entrenamiento completo de ${dias} días a la semana con MÍNIMO 8-10 ejercicios por día. ${resumen}. Incluye todos los días del plan con sus ejercicios completos.`;
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
          <label style={s.label}>Grupos musculares a trabajar (selecciona varios)</label>
          <div style={s.grid}>
            {GRUPOS_MUSCULARES.map(g => (
              <div key={g} style={s.chip(grupos.includes(g))} onClick={() => toggleGrupo(g)}>{g}</div>
            ))}
          </div>
        </div>

        <div style={s.section}>
          <label style={s.label}>Tiempo disponible por sesión</label>
          <select style={s.select} value={tiempo} onChange={e => setTiempo(e.target.value)}>
            {TIEMPO_OPCIONES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={s.section}>
          <label style={s.label}>Algo más que deba saber (lesiones, equipo, preferencias)</label>
          <input
            style={s.input}
            type="text"
            placeholder="Ej: Tengo dolor de rodilla, solo tengo mancuernas..."
            value={otro}
            onChange={e => setOtro(e.target.value)}
          />
        </div>

        <button style={s.btn} onClick={handleGenerar}>🔥 Generar mi Plan</button>
      </div>
    </div>
  );
}

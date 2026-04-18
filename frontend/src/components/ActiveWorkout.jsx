import { useState, useEffect } from 'react';
import { guardarWorkout, feedbackSerie, resumenSesion } from '../services/api';
import LoadingDots from './LoadingDots';

const s = {
  container: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' },
  title: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' },
  exerciseName: { fontSize: '1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  setRow: { display: 'grid', gridTemplateColumns: '50px 1fr 1fr 70px', gap: '0.5rem', marginBottom: '0.25rem', alignItems: 'center' },
  setLabel: { fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 700 },
  input: { padding: '0.55rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', outline: 'none' },
  doneBtn: { padding: '0.4rem 0.6rem', border: 'none', borderRadius: '4px', background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' },
  doneBtnDone: { background: 'var(--border)', color: 'var(--text-dim)', cursor: 'default' },
  feedbackBox: { padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.75rem', marginTop: '0.25rem' },
  feelInput: { width: '100%', padding: '0.4rem 0.6rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', marginTop: '0.25rem' },
  nav: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '0.5rem' },
  btn: { padding: '0.7rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  progress: { fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 },
  resumenBox: { background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: '6px', padding: '1.5rem', marginTop: '1rem' },
  sliderContainer: { marginTop: '0.25rem', marginBottom: '0.5rem', padding: '0 0.25rem' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  sliderValue: { fontSize: '0.85rem', fontWeight: 800, minWidth: '40px', textAlign: 'right' },
  sliderLabel: { fontSize: '0.7rem', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' },
};

// El slider RPE mantiene colores funcionales en AMBOS temas
const alertColors = {
  great: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', color: '#22c55e' },
  ok: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', color: '#d97706' },
  warning: { bg: 'rgba(229,62,62,0.15)', border: '#E53E3E', color: '#E53E3E' },
};

function getIntensityColor(val) {
  if (val <= 70) return '#22c55e';
  if (val <= 90) return '#f59e0b';
  return '#E53E3E';
}
function getIntensityLabel(val) {
  if (val <= 60) return 'Facil';
  if (val <= 70) return 'Moderado';
  if (val <= 80) return 'Pesado';
  if (val <= 90) return 'Muy pesado';
  return 'Al fallo';
}

function cleanAndParseJSON(text) {
  if (!text || typeof text !== 'string') return null;
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) cleaned = cleaned.substring(start, end + 1);
  try { return JSON.parse(cleaned); } catch { return null; }
}

function parseFeedback(fb) {
  if (!fb) return { feedback: 'Sin feedback', alerta: 'ok' };
  if (typeof fb.feedback === 'string') {
    const inner = cleanAndParseJSON(fb.feedback);
    if (inner && inner.feedback) {
      return {
        feedback: inner.feedback,
        alerta: inner.alerta || fb.alerta || 'ok',
        ajuste_siguiente_serie: inner.ajuste_siguiente_serie || fb.ajuste_siguiente_serie || null,
      };
    }
  }
  if (fb.feedback && typeof fb.feedback === 'string' && !fb.feedback.startsWith('{')) return fb;
  if (typeof fb === 'string') {
    const parsed = cleanAndParseJSON(fb);
    if (parsed && parsed.feedback) return parsed;
    return { feedback: fb, alerta: 'ok' };
  }
  return { feedback: String(fb.feedback || 'Sin feedback'), alerta: fb.alerta || 'ok', ajuste_siguiente_serie: fb.ajuste_siguiente_serie };
}

function flattenExercises(rutina) {
  if (!rutina) return [];
  // Si tiene ejercicios directos
  if (Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0) {
    return rutina.ejercicios;
  }
  // Si tiene dias (plan multi-dia), aplanar todos los ejercicios
  if (Array.isArray(rutina.dias)) {
    const all = [];
    for (const dia of rutina.dias) {
      const ejercicios = dia.ejercicios || dia.exercises || [];
      for (const ej of ejercicios) {
        all.push({
          ...ej,
          nombre: ej.nombre || ej.ejercicio || ej.name || 'Ejercicio',
          series: Number(ej.series) || Number(ej.sets) || 3,
          repeticiones: ej.repeticiones || ej.reps || '10-12',
          peso_sugerido_kg: ej.peso_sugerido_kg || ej.peso || ej.weight || '',
          descanso_seg: ej.descanso_seg || ej.descanso || 60,
          nota_coach: ej.nota_coach || ej.notas || '',
          musculo_principal: ej.musculo_principal || dia.grupo || dia.subtitulo || 'general',
          _dia: dia.nombre || 'Dia',
        });
      }
    }
    return all;
  }
  return [];
}

const UNIT_KEY = 'lcf_weight_unit';
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

function toUnit(kg, unit) {
  if (!kg || isNaN(Number(kg))) return kg;
  if (unit === 'lbs') return Math.round(Number(kg) * KG_TO_LBS * 10) / 10;
  return kg;
}

function toKg(val, unit) {
  if (!val || isNaN(Number(val))) return val;
  if (unit === 'lbs') return Math.round(Number(val) * LBS_TO_KG * 10) / 10;
  return val;
}

export default function ActiveWorkout({ rutina, usuarioId, onFinish }) {
  const ejercicios = flattenExercises(rutina);
  const [unit, setUnit] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(UNIT_KEY) || 'kg';
    return 'kg';
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [logs, setLogs] = useState(
    ejercicios.map((ej) =>
      Array.from({ length: ej.series || 3 }, () => ({
        pesoKg: Number(ej.peso_sugerido_kg) || 0,
        reps: '', intensidad: 70, como_se_sintio: '', done: false, feedback: null,
      }))
    )
  );
  const [saving, setSaving] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(null);
  const [sessionResumen, setSessionResumen] = useState(null);

  // Auto-save: guardar progreso en localStorage cada vez que cambian los logs
  const DRAFT_KEY = `lcf_workout_draft_${usuarioId}`;
  useEffect(() => {
    if (ejercicios.length > 0) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          rutinaNombre: rutina?.nombre || '',
          currentIdx,
          logs,
          timestamp: Date.now(),
        }));
      } catch { /* localStorage full */ }
    }
  }, [logs, currentIdx]);

  // Limpiar draft al terminar
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  const current = ejercicios[currentIdx];
  const currentLogs = logs[currentIdx] || [];

  // Guard: si no hay ejercicios, mostrar mensaje en vez de pantalla blanca
  if (ejercicios.length === 0) {
    return (
      <div style={s.container}>
        <div style={s.header}>
          <span style={s.title}>{'\u{1F525}'} {rutina?.nombre || 'Entrenamiento'}</span>
          <button onClick={onFinish} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '1.2rem' }}>{'\u2716'}</button>
        </div>
        <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>
          No se encontraron ejercicios en esta rutina. Pide al entrenador que genere una rutina con ejercicios detallados.
        </p>
        <div style={{ textAlign: 'center' }}>
          <button onClick={onFinish} style={{ ...s.btn, background: 'var(--accent)', color: '#fff' }}>Volver</button>
        </div>
      </div>
    );
  }

  const updateSet = (setIdx, field, value) => {
    setLogs((prev) => {
      const newLogs = [...prev];
      newLogs[currentIdx] = [...newLogs[currentIdx]];
      newLogs[currentIdx][setIdx] = { ...newLogs[currentIdx][setIdx], [field]: value };
      return newLogs;
    });
  };

  const completeSerie = async (setIdx) => {
    const set = currentLogs[setIdx];
    if (!set.pesoKg && !set.reps) return;
    updateSet(setIdx, 'done', true);
    setLoadingFeedback(setIdx);

    const seriesAnterioresHoy = currentLogs
      .filter((_, i) => i < setIdx && currentLogs[i].done)
      .map((s, i) => `Serie ${i + 1}: ${s.pesoKg}kg x ${s.reps} reps (intensidad ${s.intensidad}%)`)
      .join('\n') || 'Primera serie';

    try {
      const fb = await feedbackSerie(usuarioId, {
        ejercicio: current.nombre,
        musculo_principal: current.musculo_principal || 'general',
        serie_actual: setIdx + 1, series_totales: current.series || 3,
        peso: set.pesoKg, reps: set.reps, intensidad: set.intensidad,
        unidad_usuario: unit,
        como_se_sintio: set.como_se_sintio, reps_plan: current.repeticiones,
        peso_plan: current.peso_sugerido_kg || 0, series_anteriores_hoy: seriesAnterioresHoy,
      });
      const parsed = parseFeedback(fb);
      updateSet(setIdx, 'feedback', parsed);
      if (parsed.ajuste_siguiente_serie && setIdx + 1 < currentLogs.length) {
        const pesoSug = parsed.ajuste_siguiente_serie.peso_sugerido;
        if (pesoSug) {
          updateSet(setIdx + 1, 'pesoKg', Number(pesoSug) || 0);
          updateSet(setIdx + 1, '_displayPeso', undefined);
        }
      }
    } catch (err) {
      console.error('[ActiveWorkout] Error feedback-serie:', err);
      updateSet(setIdx, 'feedback', { feedback: 'No se pudo obtener feedback: ' + err.message, alerta: 'warning' });
    }
    setLoadingFeedback(null);
  };

  const handleFinish = async () => {
    setSaving(true);
    const logCompleto = ejercicios.map((ej, i) => ({
      ejercicio: ej.nombre, musculo_principal: ej.musculo_principal || 'general',
      series: logs[i].map((s, si) => ({
        serie: si + 1, peso_kg: s.pesoKg, peso_display: `${toUnit(s.pesoKg, unit)} ${unit}`,
        reps: s.reps, intensidad: s.intensidad, como_se_sintio: s.como_se_sintio,
        feedback_ia: s.feedback ? (typeof s.feedback === 'object' ? s.feedback.feedback : s.feedback) : null,
      })),
    }));
    const logStr = JSON.stringify(logCompleto);
    try {
      const rawResumen = await resumenSesion(usuarioId, { nombreRutina: rutina.nombre, ejerciciosLog: logStr });
      const resumen = { resumen: '', calificacion: 'buena', proximo_enfoque: '' };
      for (const f of ['resumen', 'calificacion', 'proximo_enfoque']) resumen[f] = rawResumen[f] || '';
      try {
        let raw = (resumen.resumen || '').replace(/```json/g, '').replace(/```/g, '').trim();
        const p = JSON.parse(raw);
        resumen.resumen = p.resumen || resumen.resumen;
        resumen.calificacion = p.calificacion || resumen.calificacion;
        resumen.proximo_enfoque = p.proximo_enfoque || resumen.proximo_enfoque;
      } catch { /* */ }
      setSessionResumen(resumen);
      await guardarWorkout(usuarioId, { nombreRutina: rutina.nombre, ejerciciosLog: logStr, completado: true, resumenSesion: resumen.resumen || '' });
      clearDraft();
    } catch {
      try {
        await guardarWorkout(usuarioId, { nombreRutina: rutina.nombre, ejerciciosLog: logStr, completado: true });
        clearDraft();
      } catch {
        // Si falla el save, NO limpiar draft para que se pueda recuperar
        alert('Error guardando entrenamiento. Tu progreso esta guardado localmente. Intenta de nuevo.');
      }
    }
    setSaving(false);
  };

  if (sessionResumen) {
    const cal = sessionResumen.calificacion || 'buena';
    const calColor = cal === 'excelente' ? '#22c55e' : cal === 'buena' ? '#E53E3E' : cal === 'regular' ? '#f59e0b' : '#E53E3E';
    return (
      <div style={s.container}>
        <div style={s.header}>
          <span style={s.title}>{'\u{1F3C6}'} Sesion Completada</span>
          <span style={{ color: calColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>{cal}</span>
        </div>
        <div style={s.resumenBox}>
          <p style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}>{sessionResumen.resumen}</p>
          {sessionResumen.proximo_enfoque && (
            <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: '6px' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{'\u{1F3AF}'} Proximo enfoque:</span>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.4rem' }}>{sessionResumen.proximo_enfoque}</p>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={onFinish} style={{ ...s.btn, background: 'var(--accent)', color: '#fff' }}>Cerrar</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const canInteract = (idx) => {
    if (idx === 0) return true;
    const prev = currentLogs[idx - 1];
    return prev.done && prev.feedback !== null;
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.title}>{'\u{1F525}'} {rutina.nombre}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Toggle KG / LBS */}
          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <button onClick={() => { setUnit('kg'); localStorage.setItem(UNIT_KEY, 'kg'); }}
              style={{ padding: '0.25rem 0.6rem', border: 'none', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                background: unit === 'kg' ? 'var(--accent)' : 'transparent', color: unit === 'kg' ? '#fff' : 'var(--text-dim)' }}>KG</button>
            <button onClick={() => { setUnit('lbs'); localStorage.setItem(UNIT_KEY, 'lbs'); }}
              style={{ padding: '0.25rem 0.6rem', border: 'none', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                background: unit === 'lbs' ? 'var(--accent)' : 'transparent', color: unit === 'lbs' ? '#fff' : 'var(--text-dim)' }}>LBS</button>
          </div>
          <button onClick={onFinish} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '1.2rem' }}>{'\u2716'}</button>
        </div>
      </div>
      <div style={s.progress}>
        {current._dia && <span style={{ color: 'var(--accent)' }}>{current._dia} - </span>}
        Ejercicio {currentIdx + 1} de {ejercicios.length}
      </div>
      <div style={s.exerciseName}>
        {current.nombre}
        {current.musculo_principal && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '0.5rem', textTransform: 'lowercase', fontWeight: 400 }}>({current.musculo_principal})</span>}
      </div>

      {/* Nota del coach para este ejercicio */}
      {current.nota_coach && (
        <div style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', color: 'var(--text)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{'\u{1F3AF}'} COACH: </span>
          {unit === 'lbs'
            ? current.nota_coach.replace(/(\d+(?:\.\d+)?)\s*kg/gi, (_, num) => `${toUnit(num, 'lbs')} lbs`)
            : current.nota_coach}
        </div>
      )}

      {/* Peso sugerido como referencia */}
      {current.peso_sugerido_kg && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.5rem', fontWeight: 600 }}>
          Peso sugerido: <span style={{ color: 'var(--text)', fontWeight: 800 }}>{toUnit(current.peso_sugerido_kg, unit)} {unit}</span>
          {' '} | {current.repeticiones} reps | Descanso: {current.descanso_seg}s
        </div>
      )}

      <div style={{ ...s.setRow, marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>SET</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>PESO ({unit})</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>REPS</span>
        <span></span>
      </div>

      {currentLogs.map((set, i) => {
        const interactable = canInteract(i);
        const blocked = !interactable && !set.done;
        const color = getIntensityColor(set.intensidad);

        return (
          <div key={i} style={{ opacity: blocked ? 0.4 : 1, pointerEvents: blocked ? 'none' : 'auto' }}>
            <div style={s.setRow}>
              <span style={s.setLabel}>#{i + 1}</span>
              <input style={s.input} type="number" placeholder="0"
                value={set.done ? toUnit(set.pesoKg, unit) : (set._displayPeso !== undefined ? set._displayPeso : toUnit(set.pesoKg, unit))}
                onChange={(e) => {
                  const display = e.target.value;
                  const inKg = toKg(display, unit);
                  updateSet(i, 'pesoKg', Number(inKg) || 0);
                  updateSet(i, '_displayPeso', display);
                }}
                disabled={set.done} />
              <input style={s.input} type="number" placeholder={String(current.repeticiones || 10)} value={set.reps} onChange={(e) => updateSet(i, 'reps', e.target.value)} disabled={set.done} />
              <button onClick={() => completeSerie(i)} disabled={set.done || loadingFeedback !== null}
                style={{ ...s.doneBtn, ...(set.done ? s.doneBtnDone : {}), opacity: loadingFeedback !== null && !set.done ? 0.5 : 1 }}>
                {loadingFeedback === i ? '...' : set.done ? '\u2713' : 'Listo'}
              </button>
            </div>

            {!set.done && interactable && (
              <div style={s.sliderContainer}>
                <div style={s.sliderRow}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>RPE</span>
                  <input type="range" min="50" max="100" step="5" value={set.intensidad}
                    onChange={(e) => updateSet(i, 'intensidad', Number(e.target.value))}
                    style={{
                      flex: 1, height: '6px', appearance: 'none',
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e 40%, #f59e0b 40%, #f59e0b 80%, #E53E3E 80%, #E53E3E 100%)`,
                      borderRadius: '3px', outline: 'none', cursor: 'pointer', accentColor: color,
                    }} />
                  <span style={{ ...s.sliderValue, color }}>{set.intensidad}%</span>
                </div>
                <div style={{ ...s.sliderLabel, color, textAlign: 'right' }}>{getIntensityLabel(set.intensidad)}</div>
                <input style={s.feelInput} placeholder="Como te sentiste? (opcional)" value={set.como_se_sintio} onChange={(e) => updateSet(i, 'como_se_sintio', e.target.value)} />
              </div>
            )}

            {loadingFeedback === i && (
              <div style={{ padding: '0.5rem 0' }}>
                <LoadingDots />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Analizando tu serie...</span>
              </div>
            )}

            {set.feedback && (() => {
              let feedbackText = '';
              let alertType = 'ok';
              let sugerido = null;
              let coachingTip = '';
              let tipoSerie = '';
              let motivacion = '';
              try {
                const fb = set.feedback;
                let raw = typeof fb === 'string' ? fb : (typeof fb.feedback === 'string' ? fb.feedback : '');
                if (raw.includes('{')) {
                  raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
                  const start = raw.indexOf('{');
                  const end = raw.lastIndexOf('}');
                  if (start >= 0 && end > start) raw = raw.substring(start, end + 1);
                  const parsed = JSON.parse(raw);
                  feedbackText = parsed.feedback || raw;
                  alertType = parsed.alerta || fb.alerta || 'ok';
                  sugerido = parsed.ajuste_siguiente_serie || fb.ajuste_siguiente_serie || null;
                  coachingTip = parsed.coaching_tip || fb.coaching_tip || '';
                  tipoSerie = parsed.tipo_siguiente_serie || fb.tipo_siguiente_serie || '';
                  motivacion = parsed.motivacion || fb.motivacion || '';
                } else {
                  feedbackText = fb.feedback || String(fb);
                  alertType = fb.alerta || 'ok';
                  sugerido = fb.ajuste_siguiente_serie || null;
                  coachingTip = fb.coaching_tip || '';
                  tipoSerie = fb.tipo_siguiente_serie || '';
                  motivacion = fb.motivacion || '';
                }
              } catch {
                const fb = set.feedback;
                feedbackText = typeof fb === 'string' ? fb : (fb.feedback || String(fb));
                alertType = (typeof fb === 'object' && fb.alerta) ? fb.alerta : 'ok';
                sugerido = (typeof fb === 'object' && fb.ajuste_siguiente_serie) ? fb.ajuste_siguiente_serie : null;
                coachingTip = (typeof fb === 'object' && fb.coaching_tip) ? fb.coaching_tip : '';
                tipoSerie = (typeof fb === 'object' && fb.tipo_siguiente_serie) ? fb.tipo_siguiente_serie : '';
                motivacion = (typeof fb === 'object' && fb.motivacion) ? fb.motivacion : '';
              }
              const colors = alertColors[alertType] || alertColors.ok;
              const tipoColors = {
                aproximacion: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', label: 'SERIE DE APROXIMACION' },
                trabajo: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: 'SERIE DE TRABAJO' },
                tope: { bg: 'rgba(229,62,62,0.12)', color: '#E53E3E', label: 'SERIE TOPE' },
                descarga: { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', label: 'SERIE DE DESCARGA' },
              };
              const tipoInfo = tipoColors[tipoSerie] || null;

              return (
                <div style={{ marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                  {/* Feedback principal */}
                  <div style={{ ...s.feedbackBox, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color, marginBottom: '0.35rem' }}>
                    {feedbackText}
                  </div>

                  {/* Coaching tip */}
                  {coachingTip && (
                    <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: '3px solid #f59e0b', color: 'var(--text)', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{'\u{1F3AF}'} TECNICA: </span>
                      {coachingTip}
                    </div>
                  )}

                  {/* Tipo de siguiente serie + peso sugerido */}
                  {(tipoInfo || (sugerido && sugerido.peso_sugerido)) && (
                    <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', background: tipoInfo ? tipoInfo.bg : 'var(--bg)', border: `1px solid ${tipoInfo ? tipoInfo.color : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      {tipoInfo && (
                        <span style={{ fontWeight: 800, color: tipoInfo.color, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {tipoSerie === 'tope' ? '\u{1F525}' : tipoSerie === 'aproximacion' ? '\u{2B06}\uFE0F' : tipoSerie === 'descarga' ? '\u{1F4A7}' : '\u{1F4AA}'} {tipoInfo.label}
                        </span>
                      )}
                      {sugerido && sugerido.peso_sugerido && (
                        <span style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.8rem' }}>
                          {toUnit(sugerido.peso_sugerido, unit)} {unit} x {sugerido.reps_sugeridas}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Motivacion */}
                  {motivacion && (
                    <div style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 800, fontStyle: 'italic', textAlign: 'center' }}>
                      "{motivacion}"
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}

      {current.notas && <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.75rem' }}>{'\u{1F4A1}'} {current.notas}</div>}

      <div style={s.nav}>
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx((p) => p - 1)}
          style={{ ...s.btn, background: 'var(--border)', color: 'var(--text-dim)', opacity: currentIdx === 0 ? 0.4 : 1 }}>Anterior</button>
        {currentIdx < ejercicios.length - 1 ? (
          <button onClick={() => setCurrentIdx((p) => p + 1)} style={{ ...s.btn, background: 'var(--accent)', color: '#fff' }}>Siguiente</button>
        ) : (
          <button onClick={handleFinish} disabled={saving} style={{ ...s.btn, background: 'var(--accent)', color: '#fff' }}>
            {saving ? 'Evaluando...' : 'Terminar'}
          </button>
        )}
      </div>
    </div>
  );
}

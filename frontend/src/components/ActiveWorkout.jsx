import { useState } from 'react';
import { guardarWorkout, feedbackSerie, resumenSesion } from '../services/api';
import LoadingDots from './LoadingDots';

const s = {
  container: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #2a2a2a' },
  title: { fontSize: '1.1rem', fontWeight: 800, color: '#E53E3E', textTransform: 'uppercase', letterSpacing: '1px' },
  exerciseName: { fontSize: '1rem', fontWeight: 800, color: '#f0f0f0', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  setRow: { display: 'grid', gridTemplateColumns: '50px 1fr 1fr 70px', gap: '0.5rem', marginBottom: '0.25rem', alignItems: 'center' },
  setLabel: { fontSize: '0.85rem', color: '#888', fontWeight: 700 },
  input: { padding: '0.55rem', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '4px', color: '#f0f0f0', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', outline: 'none' },
  doneBtn: { padding: '0.4rem 0.6rem', border: 'none', borderRadius: '4px', background: '#E53E3E', color: '#fff', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' },
  doneBtnDone: { background: '#2a2a2a', color: '#666', cursor: 'default' },
  feedbackBox: { padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.75rem', marginTop: '0.25rem' },
  feelInput: { width: '100%', padding: '0.4rem 0.6rem', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '4px', color: '#f0f0f0', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', marginTop: '0.25rem' },
  nav: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '0.5rem' },
  btn: { padding: '0.7rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  progress: { fontSize: '0.75rem', color: '#666', textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 },
  resumenBox: { background: '#0a0a0a', border: '1px solid #2a2a2a', borderLeft: '3px solid #E53E3E', borderRadius: '6px', padding: '1.5rem', marginTop: '1rem' },
  sliderContainer: { marginTop: '0.25rem', marginBottom: '0.5rem', padding: '0 0.25rem' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  sliderValue: { fontSize: '0.85rem', fontWeight: 800, minWidth: '40px', textAlign: 'right' },
  sliderLabel: { fontSize: '0.7rem', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' },
};

// El slider RPE MANTIENE sus colores funcionales (verde-amarillo-rojo) porque es informativo
const alertColors = {
  great: { bg: 'rgba(34,197,94,0.1)', border: '#22c55e', color: '#4ade80' },
  ok: { bg: 'rgba(251,191,36,0.1)', border: '#f59e0b', color: '#fbbf24' },
  warning: { bg: 'rgba(239,68,68,0.15)', border: '#E53E3E', color: '#f87171' },
};

function getIntensityColor(val) {
  if (val <= 70) return '#4ade80';
  if (val <= 90) return '#fbbf24';
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
  if (start >= 0 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }
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

export default function ActiveWorkout({ rutina, usuarioId, onFinish }) {
  const ejercicios = rutina.ejercicios || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [logs, setLogs] = useState(
    ejercicios.map((ej) =>
      Array.from({ length: ej.series || 3 }, () => ({
        peso: ej.peso_sugerido_kg || '',
        reps: '',
        intensidad: 70,
        como_se_sintio: '',
        done: false,
        feedback: null,
      }))
    )
  );
  const [saving, setSaving] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(null);
  const [sessionResumen, setSessionResumen] = useState(null);

  const current = ejercicios[currentIdx];
  const currentLogs = logs[currentIdx] || [];

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
    if (!set.peso && !set.reps) return;

    updateSet(setIdx, 'done', true);
    setLoadingFeedback(setIdx);

    const seriesAnterioresHoy = currentLogs
      .filter((_, i) => i < setIdx && currentLogs[i].done)
      .map((s, i) => `Serie ${i + 1}: ${s.peso}kg x ${s.reps} reps (intensidad ${s.intensidad}%)`)
      .join('\n') || 'Primera serie';

    try {
      const fb = await feedbackSerie(usuarioId, {
        ejercicio: current.nombre,
        musculo_principal: current.musculo_principal || 'general',
        serie_actual: setIdx + 1,
        series_totales: current.series || 3,
        peso: set.peso,
        reps: set.reps,
        intensidad: set.intensidad,
        como_se_sintio: set.como_se_sintio,
        reps_plan: current.repeticiones,
        peso_plan: current.peso_sugerido_kg || 0,
        series_anteriores_hoy: seriesAnterioresHoy,
      });

      const parsed = parseFeedback(fb);
      updateSet(setIdx, 'feedback', parsed);

      if (parsed.ajuste_siguiente_serie && setIdx + 1 < currentLogs.length) {
        const pesoSug = parsed.ajuste_siguiente_serie.peso_sugerido;
        if (pesoSug) updateSet(setIdx + 1, 'peso', String(pesoSug));
      }
    } catch (err) {
      console.error('[ActiveWorkout] Error en feedback-serie:', err);
      updateSet(setIdx, 'feedback', { feedback: 'No se pudo obtener feedback: ' + err.message, alerta: 'warning' });
    }
    setLoadingFeedback(null);
  };

  const handleFinish = async () => {
    setSaving(true);
    const logCompleto = ejercicios.map((ej, i) => ({
      ejercicio: ej.nombre,
      musculo_principal: ej.musculo_principal || 'general',
      series: logs[i].map((s, si) => ({
        serie: si + 1, peso: s.peso, reps: s.reps, intensidad: s.intensidad, como_se_sintio: s.como_se_sintio,
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
    } catch {
      await guardarWorkout(usuarioId, { nombreRutina: rutina.nombre, ejerciciosLog: logStr, completado: true }).catch(() => {});
    }
    setSaving(false);
  };

  if (sessionResumen) {
    const cal = sessionResumen.calificacion || 'buena';
    const calColor = cal === 'excelente' ? '#4ade80' : cal === 'buena' ? '#E53E3E' : cal === 'regular' ? '#fbbf24' : '#f87171';
    return (
      <div style={s.container}>
        <div style={s.header}>
          <span style={s.title}>{'\u{1F3C6}'} Sesion Completada</span>
          <span style={{ color: calColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>{cal}</span>
        </div>
        <div style={s.resumenBox}>
          <p style={{ color: '#f0f0f0', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}>{sessionResumen.resumen}</p>
          {sessionResumen.proximo_enfoque && (
            <div style={{ marginTop: '1rem', padding: '0.85rem', background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: '3px solid #E53E3E', borderRadius: '6px' }}>
              <span style={{ color: '#E53E3E', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{'\u{1F3AF}'} Proximo enfoque:</span>
              <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.4rem' }}>{sessionResumen.proximo_enfoque}</p>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={onFinish} style={{ ...s.btn, background: '#E53E3E', color: '#fff' }}>Cerrar</button>
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
        <button onClick={onFinish} style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer', fontSize: '1.2rem' }}>{'\u2716'}</button>
      </div>
      <div style={s.progress}>Ejercicio {currentIdx + 1} de {ejercicios.length}</div>
      <div style={s.exerciseName}>
        {current.nombre}
        {current.musculo_principal && <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.5rem', textTransform: 'lowercase', fontWeight: 400 }}>({current.musculo_principal})</span>}
      </div>

      <div style={{ ...s.setRow, marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>SET</span>
        <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>PESO (kg)</span>
        <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>REPS</span>
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
              <input style={s.input} type="number" placeholder="0" value={set.peso} onChange={(e) => updateSet(i, 'peso', e.target.value)} disabled={set.done} />
              <input style={s.input} type="number" placeholder={String(current.repeticiones || 10)} value={set.reps} onChange={(e) => updateSet(i, 'reps', e.target.value)} disabled={set.done} />
              <button
                onClick={() => completeSerie(i)}
                disabled={set.done || loadingFeedback !== null}
                style={{ ...s.doneBtn, ...(set.done ? s.doneBtnDone : {}), opacity: loadingFeedback !== null && !set.done ? 0.5 : 1 }}
              >
                {loadingFeedback === i ? '...' : set.done ? '\u2713' : 'Listo'}
              </button>
            </div>

            {!set.done && interactable && (
              <div style={s.sliderContainer}>
                <div style={s.sliderRow}>
                  <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>RPE</span>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={set.intensidad}
                    onChange={(e) => updateSet(i, 'intensidad', Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: '6px',
                      appearance: 'none',
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e 40%, #fbbf24 40%, #fbbf24 80%, #E53E3E 80%, #E53E3E 100%)`,
                      borderRadius: '3px',
                      outline: 'none',
                      cursor: 'pointer',
                      accentColor: color,
                    }}
                  />
                  <span style={{ ...s.sliderValue, color }}>{set.intensidad}%</span>
                </div>
                <div style={{ ...s.sliderLabel, color, textAlign: 'right' }}>{getIntensityLabel(set.intensidad)}</div>
                <input style={s.feelInput} placeholder="Como te sentiste? (opcional)" value={set.como_se_sintio} onChange={(e) => updateSet(i, 'como_se_sintio', e.target.value)} />
              </div>
            )}

            {loadingFeedback === i && (
              <div style={{ padding: '0.5rem 0' }}>
                <LoadingDots />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Analizando tu serie...</span>
              </div>
            )}

            {set.feedback && (() => {
              let feedbackText = '';
              let alertType = 'ok';
              let sugerido = null;
              try {
                const fb = set.feedback;
                let raw = typeof fb === 'string' ? fb : (typeof fb.feedback === 'string' ? fb.feedback : '');
                if (raw.includes('{')) {
                  raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
                  const parsed = JSON.parse(raw);
                  feedbackText = parsed.feedback || raw;
                  alertType = parsed.alerta || fb.alerta || 'ok';
                  sugerido = parsed.ajuste_siguiente_serie || fb.ajuste_siguiente_serie || null;
                } else {
                  feedbackText = fb.feedback || String(fb);
                  alertType = fb.alerta || 'ok';
                  sugerido = fb.ajuste_siguiente_serie || null;
                }
              } catch {
                const fb = set.feedback;
                feedbackText = typeof fb === 'string' ? fb : (fb.feedback || String(fb));
                alertType = (typeof fb === 'object' && fb.alerta) ? fb.alerta : 'ok';
                sugerido = (typeof fb === 'object' && fb.ajuste_siguiente_serie) ? fb.ajuste_siguiente_serie : null;
              }
              const colors = alertColors[alertType] || alertColors.ok;
              return (
                <div style={{ ...s.feedbackBox, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color }}>
                  {feedbackText}
                  {sugerido && sugerido.peso_sugerido && (
                    <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Siguiente: {sugerido.peso_sugerido}kg x {sugerido.reps_sugeridas}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}

      {current.notas && <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.75rem' }}>{'\u{1F4A1}'} {current.notas}</div>}

      <div style={s.nav}>
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx((p) => p - 1)} style={{ ...s.btn, background: '#2a2a2a', color: '#888', opacity: currentIdx === 0 ? 0.4 : 1 }}>Anterior</button>
        {currentIdx < ejercicios.length - 1 ? (
          <button onClick={() => setCurrentIdx((p) => p + 1)} style={{ ...s.btn, background: '#E53E3E', color: '#fff' }}>Siguiente</button>
        ) : (
          <button onClick={handleFinish} disabled={saving} style={{ ...s.btn, background: '#E53E3E', color: '#fff' }}>
            {saving ? 'Evaluando...' : 'Terminar'}
          </button>
        )}
      </div>
    </div>
  );
}

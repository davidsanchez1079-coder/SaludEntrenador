import { useState } from 'react';
import { guardarWorkout, feedbackSerie, resumenSesion } from '../services/api';

const s = {
  container: { background: '#111916', border: '1px solid #1e2d27', borderRadius: '12px', padding: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' },
  exerciseName: { fontSize: '1rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.75rem' },
  setRow: { display: 'grid', gridTemplateColumns: '50px 1fr 1fr 60px 70px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' },
  setLabel: { fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 },
  input: { padding: '0.5rem', background: '#0a0f0d', border: '1px solid #2d3a35', borderRadius: '6px', color: '#e0e0e0', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', outline: 'none' },
  checkbox: { width: '18px', height: '18px', accentColor: '#f87171', cursor: 'pointer' },
  doneBtn: { padding: '0.3rem 0.6rem', border: 'none', borderRadius: '6px', background: '#4ade80', color: '#0a0f0d', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  doneBtnDone: { background: '#1e2d27', color: '#64748b' },
  feedbackBox: { padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '0.5rem', marginTop: '0.25rem' },
  feelInput: { width: '100%', padding: '0.4rem 0.6rem', background: '#0a0f0d', border: '1px solid #2d3a35', borderRadius: '6px', color: '#e0e0e0', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', marginTop: '0.25rem' },
  nav: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '0.5rem' },
  btn: { padding: '0.6rem 1.5rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' },
  progress: { fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '1rem' },
  resumenBox: { background: '#0f1a14', border: '1px solid #1e2d27', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' },
};

const alertColors = { great: { bg: '#052e16', border: '#166534', color: '#4ade80' }, ok: { bg: '#1c1a13', border: '#854d0e', color: '#fbbf24' }, warning: { bg: '#1c1517', border: '#7f1d1d', color: '#f87171' } };

export default function ActiveWorkout({ rutina, usuarioId, onFinish }) {
  const ejercicios = rutina.ejercicios || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [logs, setLogs] = useState(
    ejercicios.map((ej) =>
      Array.from({ length: ej.series || 3 }, () => ({ peso: ej.peso_sugerido_kg || '', reps: '', al_fallo: false, como_se_sintio: '', done: false, feedback: null }))
    )
  );
  const [saving, setSaving] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(null);
  const [sessionResumen, setSessionResumen] = useState(null);

  const current = ejercicios[currentIdx];
  const currentLogs = logs[currentIdx] || [];

  const updateSet = (setIdx, field, value) => {
    const newLogs = [...logs];
    newLogs[currentIdx] = [...newLogs[currentIdx]];
    newLogs[currentIdx][setIdx] = { ...newLogs[currentIdx][setIdx], [field]: value };
    setLogs(newLogs);
  };

  const completeSerie = async (setIdx) => {
    const set = currentLogs[setIdx];
    if (!set.peso && !set.reps) return;

    updateSet(setIdx, 'done', true);
    setLoadingFeedback(setIdx);

    const seriesAnterioresHoy = currentLogs
      .filter((s, i) => i < setIdx && s.done)
      .map((s, i) => `Serie ${i + 1}: ${s.peso}kg x ${s.reps} reps${s.al_fallo ? ' (al fallo)' : ''}`)
      .join('\n') || 'Primera serie';

    try {
      const fb = await feedbackSerie(usuarioId, {
        ejercicio: current.nombre,
        musculo_principal: current.musculo_principal || 'general',
        serie_actual: setIdx + 1,
        series_totales: current.series || 3,
        peso: set.peso,
        reps: set.reps,
        al_fallo: set.al_fallo,
        como_se_sintio: set.como_se_sintio,
        reps_plan: current.repeticiones,
        peso_plan: current.peso_sugerido_kg || 0,
        series_anteriores_hoy: seriesAnterioresHoy,
      });

      updateSet(setIdx, 'feedback', fb);

      // Pre-llenar peso sugerido de siguiente serie
      if (fb.ajuste_siguiente_serie && setIdx + 1 < currentLogs.length) {
        const pesoSug = fb.ajuste_siguiente_serie.peso_sugerido;
        if (pesoSug) updateSet(setIdx + 1, 'peso', String(pesoSug));
      }
    } catch {
      updateSet(setIdx, 'feedback', { feedback: 'No se pudo obtener feedback', alerta: 'ok' });
    }
    setLoadingFeedback(null);
  };

  const handleFinish = async () => {
    setSaving(true);
    const logCompleto = ejercicios.map((ej, i) => ({
      ejercicio: ej.nombre,
      musculo_principal: ej.musculo_principal || 'general',
      series: logs[i].map((s, si) => ({
        serie: si + 1,
        peso: s.peso,
        reps: s.reps,
        al_fallo: s.al_fallo,
        como_se_sintio: s.como_se_sintio,
      })),
    }));
    const logStr = JSON.stringify(logCompleto);

    try {
      // Pedir resumen de sesion
      const resumen = await resumenSesion(usuarioId, {
        nombreRutina: rutina.nombre,
        ejerciciosLog: logStr,
      });
      setSessionResumen(resumen);

      // Guardar entrenamiento con resumen
      await guardarWorkout(usuarioId, {
        nombreRutina: rutina.nombre,
        ejerciciosLog: logStr,
        completado: true,
        resumenSesion: resumen.resumen || '',
      });
    } catch {
      await guardarWorkout(usuarioId, { nombreRutina: rutina.nombre, ejerciciosLog: logStr, completado: true }).catch(() => {});
    }
    setSaving(false);
  };

  if (sessionResumen) {
    const cal = sessionResumen.calificacion || 'buena';
    const calColor = cal === 'excelente' ? '#4ade80' : cal === 'buena' ? '#60a5fa' : cal === 'regular' ? '#fbbf24' : '#f87171';
    return (
      <div style={s.container}>
        <div style={s.header}>
          <span style={s.title}>{'\u{1F3C6}'} Sesion Completada</span>
          <span style={{ color: calColor, fontWeight: 700, textTransform: 'uppercase' }}>{cal}</span>
        </div>
        <div style={s.resumenBox}>
          <p style={{ color: '#e0e0e0', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}>{sessionResumen.resumen}</p>
          {sessionResumen.proximo_enfoque && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#111c2e', border: '1px solid #1e3a5f', borderRadius: '8px' }}>
              <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.85rem' }}>{'\u{1F3AF}'} Proximo enfoque:</span>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>{sessionResumen.proximo_enfoque}</p>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={onFinish} style={{ ...s.btn, background: '#4ade80', color: '#0a0f0d' }}>Cerrar</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.title}>{'\u{1F3CB}'} {rutina.nombre}</span>
        <button onClick={onFinish} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.2rem' }}>{'\u2716'}</button>
      </div>
      <div style={s.progress}>Ejercicio {currentIdx + 1} de {ejercicios.length}</div>
      <div style={s.exerciseName}>{current.nombre} {current.musculo_principal && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({current.musculo_principal})</span>}</div>

      <div style={{ ...s.setRow, marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>SET</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>PESO (kg)</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>REPS</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>FALLO</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}></span>
      </div>

      {currentLogs.map((set, i) => (
        <div key={i}>
          <div style={s.setRow}>
            <span style={s.setLabel}>#{i + 1}</span>
            <input style={s.input} type="number" placeholder="0" value={set.peso} onChange={(e) => updateSet(i, 'peso', e.target.value)} disabled={set.done} />
            <input style={s.input} type="number" placeholder={String(current.repeticiones || 10)} value={set.reps} onChange={(e) => updateSet(i, 'reps', e.target.value)} disabled={set.done} />
            <div style={{ textAlign: 'center' }}>
              <input type="checkbox" style={s.checkbox} checked={set.al_fallo} onChange={(e) => updateSet(i, 'al_fallo', e.target.checked)} disabled={set.done} />
            </div>
            <button
              onClick={() => completeSerie(i)}
              disabled={set.done || loadingFeedback !== null}
              style={{ ...s.doneBtn, ...(set.done ? s.doneBtnDone : {}), opacity: loadingFeedback !== null && !set.done ? 0.5 : 1 }}
            >
              {loadingFeedback === i ? '...' : set.done ? 'Hecho' : 'Listo'}
            </button>
          </div>
          {!set.done && (
            <input style={s.feelInput} placeholder="Como te sentiste? (opcional)" value={set.como_se_sintio} onChange={(e) => updateSet(i, 'como_se_sintio', e.target.value)} />
          )}
          {set.feedback && (
            <div style={{
              ...s.feedbackBox,
              background: (alertColors[set.feedback.alerta] || alertColors.ok).bg,
              border: `1px solid ${(alertColors[set.feedback.alerta] || alertColors.ok).border}`,
              color: (alertColors[set.feedback.alerta] || alertColors.ok).color,
            }}>
              {set.feedback.feedback}
              {set.feedback.ajuste_siguiente_serie && (
                <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                  Siguiente: {set.feedback.ajuste_siguiente_serie.peso_sugerido}kg x {set.feedback.ajuste_siguiente_serie.reps_sugeridas}
                </span>
              )}
            </div>
          )}
        </div>
      ))}

      {current.notas && <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.75rem' }}>{'\u{1F4A1}'} {current.notas}</div>}

      <div style={s.nav}>
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx((p) => p - 1)} style={{ ...s.btn, background: '#1e2d27', color: '#94a3b8', opacity: currentIdx === 0 ? 0.4 : 1 }}>
          Anterior
        </button>
        {currentIdx < ejercicios.length - 1 ? (
          <button onClick={() => setCurrentIdx((p) => p + 1)} style={{ ...s.btn, background: '#60a5fa', color: '#0a0f0d' }}>Siguiente</button>
        ) : (
          <button onClick={handleFinish} disabled={saving} style={{ ...s.btn, background: '#4ade80', color: '#0a0f0d' }}>
            {saving ? 'Evaluando sesion...' : 'Terminar'}
          </button>
        )}
      </div>
    </div>
  );
}

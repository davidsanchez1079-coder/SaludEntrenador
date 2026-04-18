import { useState, useEffect } from 'react';
import { getUsuario, updateUsuario, borrarHistorial } from '../services/api';

const s = {
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  title: { fontSize: '1rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.8px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  gridFull: { gridColumn: '1 / -1' },
  label: { display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { width: '100%', padding: '0.7rem 0.8rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.92rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.7rem 0.8rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.92rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.7rem 0.8rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.92rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical', minHeight: '70px', boxSizing: 'border-box' },
  btn: { padding: '0.75rem 1.8rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.8px' },
  msg: { padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' },
  progress: { width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' },
  progressBar: { height: '100%', background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.3s' },
};

const fields = ['nombre', 'edad', 'sexo', 'pesoInicial', 'estatura', 'objetivoGeneral', 'objetivoEspecifico', 'telefono', 'correo', 'condiciones', 'alergias'];

export default function Profile({ usuarioId, onProfileSaved, onLogout }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [borrandoHistorial, setBorrandoHistorial] = useState(false);

  useEffect(() => {
    getUsuario(usuarioId)
      .then(setForm)
      .catch(() => setMessage({ type: 'error', text: 'Error cargando perfil' }));
  }, [usuarioId]);

  const filled = fields.filter((f) => form[f] && String(form[f]).trim()).length;
  const progress = Math.round((filled / fields.length) * 100);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateUsuario(usuarioId, form);
      setForm(updated);
      if (updated?.correo) localStorage.setItem('saludentrenador_usuario_correo', updated.correo);
      if (onProfileSaved) onProfileSaved(updated);
      setMessage({ type: 'success', text: 'Perfil guardado correctamente' });
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar perfil' });
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSave}>
      <div style={s.progress}>
        <div style={{ ...s.progressBar, width: `${progress}%` }} />
      </div>

      {message && (
        <div style={{ ...s.msg, background: message.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: message.type === 'success' ? '#22c55e' : '#f87171', border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}` }}>
          {message.text}
        </div>
      )}

      <div style={s.card}>
        <div style={s.title}>👤 Datos personales</div>
        <div style={s.grid}>
          <Field label="Nombre" value={form.nombre || ''} onChange={(v) => handleChange('nombre', v)} />
          <Field label="Correo" value={form.correo || ''} onChange={(v) => handleChange('correo', v)} type="email" />
          <Field label="Teléfono" value={form.telefono || ''} onChange={(v) => handleChange('telefono', v)} type="tel" />
          <Field label="Edad" value={form.edad || ''} onChange={(v) => handleChange('edad', v ? Number(v) : null)} type="number" />
          <div>
            <label style={s.label}>Sexo</label>
            <select style={s.select} value={form.sexo || ''} onChange={(e) => handleChange('sexo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Objetivo general</label>
            <select style={s.select} value={form.objetivoGeneral || ''} onChange={(e) => handleChange('objetivoGeneral', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="Pérdida de peso">Pérdida de peso</option>
              <option value="Ganancia muscular">Ganancia muscular</option>
              <option value="Tonificación">Tonificación</option>
              <option value="Resistencia">Resistencia</option>
              <option value="Flexibilidad">Flexibilidad</option>
              <option value="Salud general">Salud general</option>
              <option value="Rehabilitación">Rehabilitación</option>
            </select>
          </div>
          <div style={s.gridFull}>
            <label style={s.label}>Objetivo específico (tu prioridad)</label>
            <textarea style={s.textarea} value={form.objetivoEspecifico || ''} onChange={(e) => handleChange('objetivoEspecifico', e.target.value)} placeholder="Ej: Crecer glúteo, hombros más anchos, marcar abdomen..." />
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.title}>📏 Datos corporales</div>
        <div style={s.grid}>
          <Field label="Peso inicial (kg)" value={form.pesoInicial || ''} onChange={(v) => handleChange('pesoInicial', v ? Number(v) : null)} type="number" step="0.1" />
          <Field label="Estatura (cm)" value={form.estatura || ''} onChange={(v) => handleChange('estatura', v ? Number(v) : null)} type="number" step="0.1" />
        </div>
      </div>

      <div style={s.card}>
        <div style={s.title}>🩺 Información médica</div>
        <div style={s.grid}>
          <div style={s.gridFull}>
            <label style={s.label}>Condiciones médicas</label>
            <textarea style={s.textarea} value={form.condiciones || ''} onChange={(e) => handleChange('condiciones', e.target.value)} placeholder="Diabetes, hipertensión, etc." />
          </div>
          <div style={s.gridFull}>
            <label style={s.label}>Alergias</label>
            <textarea style={s.textarea} value={form.alergias || ''} onChange={(e) => handleChange('alergias', e.target.value)} placeholder="Lactosa, gluten, etc." />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button type="submit" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>

      {/* Zona de cuenta */}
      <div style={{ ...s.card, marginTop: '2rem', borderColor: 'rgba(239,68,68,0.2)' }}>
        <div style={s.title}>{'\u2699\uFE0F'} Cuenta</div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Esto borrara TODO tu historial de salud y entrenamientos. Tu perfil se mantiene. Continuar?')) return;
              setBorrandoHistorial(true);
              try {
                const res = await borrarHistorial(usuarioId);
                setMessage({ type: 'success', text: res.mensaje || 'Historial borrado' });
              } catch {
                setMessage({ type: 'error', text: 'Error al borrar historial' });
              }
              setBorrandoHistorial(false);
            }}
            disabled={borrandoHistorial}
            style={{ padding: '0.6rem 1.2rem', background: 'transparent', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            {borrandoHistorial ? 'Borrando...' : 'Borrar historial'}
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={() => {
                if (!confirm('Cerrar sesion? Podras volver a entrar con tu correo.')) return;
                localStorage.removeItem('saludentrenador_usuario_id');
                localStorage.removeItem('saludentrenador_usuario_correo');
                localStorage.removeItem('saludentrenador_auto_login');
                localStorage.removeItem('saludentrenador_guest_mode');
                onLogout();
              }}
              style={{ padding: '0.6rem 1.2rem', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Cerrar sesion
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = 'text', step }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

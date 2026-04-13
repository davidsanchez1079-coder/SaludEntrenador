import { useState, useEffect } from 'react';
import { getUsuario, updateUsuario } from '../services/api';

const s = {
  card: { background: '#111916', border: '1px solid #1e2d27', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  title: { fontSize: '1rem', fontWeight: 700, color: '#4ade80', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  gridFull: { gridColumn: '1 / -1' },
  label: { display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 },
  input: { width: '100%', padding: '0.6rem 0.75rem', background: '#0a0f0d', border: '1px solid #2d3a35', borderRadius: '8px', color: '#e0e0e0', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  select: { width: '100%', padding: '0.6rem 0.75rem', background: '#0a0f0d', border: '1px solid #2d3a35', borderRadius: '8px', color: '#e0e0e0', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  textarea: { width: '100%', padding: '0.6rem 0.75rem', background: '#0a0f0d', border: '1px solid #2d3a35', borderRadius: '8px', color: '#e0e0e0', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical', minHeight: '60px' },
  btn: { padding: '0.7rem 2rem', background: '#4ade80', color: '#0a0f0d', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  msg: { padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' },
  progress: { width: '100%', height: '6px', background: '#1e2d27', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' },
  progressBar: { height: '100%', background: '#4ade80', borderRadius: '3px', transition: 'width 0.3s' },
};

const fields = ['nombre', 'edad', 'sexo', 'pesoInicial', 'estatura', 'objetivo', 'telefono', 'correo', 'condiciones', 'alergias'];

export default function Profile({ usuarioId }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getUsuario(usuarioId).then(setForm).catch(() => setMessage({ type: 'error', text: 'Error cargando perfil' }));
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
      setMessage({ type: 'success', text: 'Perfil guardado correctamente' });
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar' });
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSave}>
      <div style={s.progress}>
        <div style={{ ...s.progressBar, width: `${progress}%` }} />
      </div>

      {message && (
        <div style={{ ...s.msg, background: message.type === 'success' ? '#052e16' : '#1c1517', color: message.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${message.type === 'success' ? '#166534' : '#7f1d1d'}` }}>
          {message.text}
        </div>
      )}

      <div style={s.card}>
        <div style={s.title}>{'\u{1F464}'} Datos Personales</div>
        <div style={s.grid}>
          <Field label="Nombre" value={form.nombre || ''} onChange={(v) => handleChange('nombre', v)} />
          <Field label="Correo" value={form.correo || ''} onChange={(v) => handleChange('correo', v)} type="email" />
          <Field label="Telefono" value={form.telefono || ''} onChange={(v) => handleChange('telefono', v)} type="tel" />
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
            <label style={s.label}>Objetivo</label>
            <select style={s.select} value={form.objetivo || ''} onChange={(e) => handleChange('objetivo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="Perdida de peso">Perdida de peso</option>
              <option value="Ganancia muscular">Ganancia muscular</option>
              <option value="Tonificacion">Tonificacion</option>
              <option value="Resistencia">Resistencia</option>
              <option value="Flexibilidad">Flexibilidad</option>
              <option value="Salud general">Salud general</option>
              <option value="Rehabilitacion">Rehabilitacion</option>
            </select>
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.title}>{'\u{1F4CF}'} Datos Corporales</div>
        <div style={s.grid}>
          <Field label="Peso inicial (kg)" value={form.pesoInicial || ''} onChange={(v) => handleChange('pesoInicial', v ? Number(v) : null)} type="number" step="0.1" />
          <Field label="Estatura (cm)" value={form.estatura || ''} onChange={(v) => handleChange('estatura', v ? Number(v) : null)} type="number" step="0.1" />
        </div>
      </div>

      <div style={s.card}>
        <div style={s.title}>{'\u{1FA7A}'} Informacion Medica</div>
        <div style={s.grid}>
          <div style={s.gridFull}>
            <label style={s.label}>Condiciones medicas</label>
            <textarea style={s.textarea} value={form.condiciones || ''} onChange={(e) => handleChange('condiciones', e.target.value)} placeholder="Diabetes, hipertension, etc." />
          </div>
          <div style={s.gridFull}>
            <label style={s.label}>Alergias</label>
            <textarea style={s.textarea} value={form.alergias || ''} onChange={(e) => handleChange('alergias', e.target.value)} placeholder="Lactosa, gluten, etc." />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <button type="submit" style={{ ...s.btn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Perfil'}
        </button>
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

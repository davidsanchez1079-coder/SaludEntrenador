import { useState, useEffect } from 'react';
import { getUsuario, updateUsuario } from '../services/api';

const s = {
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' },
  title: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  gridFull: { gridColumn: '1 / -1' },
  label: { display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '0.65rem 0.8rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  select: { width: '100%', padding: '0.65rem 0.8rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  textarea: { width: '100%', padding: '0.65rem 0.8rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical', minHeight: '60px' },
  btn: { padding: '0.75rem 2.5rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '1px' },
  msg: { padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' },
  progress: { width: '100%', height: '4px', background: 'var(--bg2)', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' },
  progressBar: { height: '100%', background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.3s' },
};

const fields = ['nombre', 'edad', 'sexo', 'pesoInicial', 'estatura', 'objetivoGeneral', 'objetivoEspecifico', 'telefono', 'correo', 'condiciones', 'alergias'];

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
    } catch { setMessage({ type: 'error', text: 'Error al guardar' }); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSave}>
      <div style={s.progress}><div style={{ ...s.progressBar, width: `${progress}%` }} /></div>
      {message && <div style={s.msg}>{message.text}</div>}

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
              <option value="">Seleccionar</option><option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option><option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Objetivo General</label>
            <select style={s.select} value={form.objetivoGeneral || ''} onChange={(e) => handleChange('objetivoGeneral', e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="Ganar musculo">Ganar musculo</option>
              <option value="Bajar grasa">Bajar grasa</option>
              <option value="Tonificar">Tonificar</option>
              <option value="Fuerza">Fuerza</option>
              <option value="Resistencia">Resistencia</option>
              <option value="Recomposicion corporal">Recomposicion corporal</option>
            </select>
          </div>
          <div style={s.gridFull}>
            <label style={s.label}>Objetivo Especifico (TU PRIORIDAD)</label>
            <input style={s.input} value={form.objetivoEspecifico || ''} onChange={(e) => handleChange('objetivoEspecifico', e.target.value)} placeholder="Ej: Crecer gluteo, Hombros mas anchos, Marcar abdomen..." />
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

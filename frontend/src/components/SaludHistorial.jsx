import { useState, useEffect } from 'react';
import { getHistorialSalud } from '../services/api';
import Badge from './Badge';

const categorias = ['', 'MEDICAMENTO', 'SINTOMA', 'MEDIDA', 'LABORATORIO', 'BIENESTAR', 'NUTRICION'];

const s = {
  filters: { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 },
  filterActive: { background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem' },
  date: { fontSize: '0.75rem', color: 'var(--text-dim)' },
  text: { fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.5rem' },
  response: { fontSize: '0.85rem', color: 'var(--text-dim)', background: 'var(--bg)', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem', whiteSpace: 'pre-wrap', borderLeft: '2px solid var(--accent)' },
  empty: { textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' },
};

export default function SaludHistorial({ usuarioId }) {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getHistorialSalud(usuarioId, filter || undefined).then(setEntries).catch(() => setEntries([]));
  }, [usuarioId, filter]);

  return (
    <div>
      <div style={s.filters}>
        {categorias.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ ...s.filterBtn, ...(filter === cat ? s.filterActive : {}) }}>
            {cat || 'Todas'}
          </button>
        ))}
      </div>

      {entries.length === 0 && <div style={s.empty}><p>No hay registros{filter ? ` en ${filter}` : ''}.</p></div>}

      {entries.map((entry) => (
        <div key={entry.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <Badge categoria={entry.categoria} />
            <span style={s.date}>{entry.fecha ? new Date(entry.fecha).toLocaleDateString() : ''}</span>
          </div>
          <div style={s.text}>{entry.textoOriginal}</div>
          {entry.respuestaIA && <div style={s.response}>{entry.respuestaIA}</div>}
        </div>
      ))}
    </div>
  );
}

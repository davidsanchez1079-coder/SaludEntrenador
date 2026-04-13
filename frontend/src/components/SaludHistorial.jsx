import { useState, useEffect } from 'react';
import { getHistorialSalud } from '../services/api';
import Badge from './Badge';

const categorias = ['', 'MEDICAMENTO', 'SINTOMA', 'MEDIDA', 'LABORATORIO', 'BIENESTAR', 'NUTRICION'];

const s = {
  filters: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid #2d3a35', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" },
  filterActive: { background: '#1a2f24', color: '#4ade80', borderColor: '#4ade80' },
  card: { background: '#111916', border: '1px solid #1e2d27', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' },
  date: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' },
  text: { fontSize: '0.9rem', color: '#e0e0e0', marginBottom: '0.5rem' },
  response: { fontSize: '0.85rem', color: '#94a3b8', background: '#0a0f0d', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem', whiteSpace: 'pre-wrap' },
  empty: { textAlign: 'center', padding: '3rem', color: '#64748b' },
};

export default function SaludHistorial({ usuarioId }) {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getHistorialSalud(usuarioId, filter || undefined)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [usuarioId, filter]);

  return (
    <div>
      <div style={s.filters}>
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{ ...s.filterBtn, ...(filter === cat ? s.filterActive : {}) }}
          >
            {cat || 'Todas'}
          </button>
        ))}
      </div>

      {entries.length === 0 && (
        <div style={s.empty}>
          <p>No hay registros de salud{filter ? ` en ${filter}` : ''}.</p>
        </div>
      )}

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

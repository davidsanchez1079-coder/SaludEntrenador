import { useState, useEffect } from 'react';
import { getHistorialSalud } from '../services/api';
import Badge from './Badge';

const categorias = ['', 'MEDICAMENTO', 'SINTOMA', 'MEDIDA', 'LABORATORIO', 'BIENESTAR', 'NUTRICION'];

const s = {
  filters: { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #2a2a2a', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 },
  filterActive: { background: 'rgba(229,62,62,0.15)', color: '#E53E3E', borderColor: '#E53E3E' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem' },
  date: { fontSize: '0.75rem', color: '#666' },
  text: { fontSize: '0.9rem', color: '#f0f0f0', marginBottom: '0.5rem' },
  response: { fontSize: '0.85rem', color: '#888', background: '#0a0a0a', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem', whiteSpace: 'pre-wrap', borderLeft: '2px solid #E53E3E' },
  empty: { textAlign: 'center', padding: '3rem', color: '#666' },
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

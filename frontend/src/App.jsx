import { useState, useEffect } from 'react';
import { getUsuario } from './services/api';
import './App.css';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsuario(1)
      .then(setUsuario)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f0d',
      color: '#e0e0e0',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '2.5rem', color: '#4ade80', marginBottom: '0.5rem' }}>
        SaludEntrenador
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
        Plataforma de salud y entrenamiento personal con IA
      </p>

      {error && (
        <div style={{
          background: '#1c1c1c',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
        }}>
          <p style={{ color: '#ef4444' }}>Error conectando al backend: {error}</p>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Asegurate de que el backend este corriendo en localhost:8080
          </p>
        </div>
      )}

      {usuario && (
        <div style={{
          background: '#1a1f1d',
          border: '1px solid #2d3a35',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
        }}>
          <h2 style={{ color: '#4ade80', fontSize: '1.2rem', marginBottom: '1rem' }}>
            Conectado al backend
          </h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <InfoRow label="Nombre" value={usuario.nombre} />
            <InfoRow label="Edad" value={`${usuario.edad} anios`} />
            <InfoRow label="Peso" value={`${usuario.pesoInicial} kg`} />
            <InfoRow label="Estatura" value={`${usuario.estatura} cm`} />
            <InfoRow label="Objetivo" value={usuario.objetivo} />
          </div>
        </div>
      )}

      {!usuario && !error && (
        <p style={{ color: '#94a3b8' }}>Cargando...</p>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #2d3a35' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { getUsuario, createUsuario } from './services/api';
import Layout from './components/Layout';
import Profile from './components/Profile';
import SaludChat from './components/SaludChat';
import SaludHistorial from './components/SaludHistorial';
import EntrenadorChat from './components/EntrenadorChat';
import EntrenadorHistorial from './components/EntrenadorHistorial';
import ActiveWorkout from './components/ActiveWorkout';
import './App.css';

const STORAGE_KEY = 'saludentrenador_usuario_id';

const subTabStyle = {
  container: { display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid #1e2d27', paddingBottom: '0.5rem' },
  btn: { padding: '0.4rem 1rem', border: 'none', borderRadius: '6px 6px 0 0', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderBottom: '2px solid transparent' },
  active: { color: '#4ade80', borderBottomColor: '#4ade80' },
};

async function getOrCreateUsuario() {
  // Intentar cargar ID de localStorage
  const savedId = localStorage.getItem(STORAGE_KEY);
  if (savedId) {
    try {
      const user = await getUsuario(Number(savedId));
      return user.id;
    } catch {
      // ID guardado ya no existe, crear nuevo
    }
  }

  // Crear usuario nuevo
  const newUser = await createUsuario({ nombre: 'Mi Perfil' });
  localStorage.setItem(STORAGE_KEY, String(newUser.id));
  return newUser.id;
}

function App() {
  const [usuarioId, setUsuarioId] = useState(null);
  const [activeTab, setActiveTab] = useState('perfil');
  const [saludSubTab, setSaludSubTab] = useState('chat');
  const [entrenadorSubTab, setEntrenadorSubTab] = useState('chat');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [saludConnected, setSaludConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getOrCreateUsuario()
      .then((id) => { setUsuarioId(id); setSaludConnected(true); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || !usuarioId) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        {loaded ? 'Error conectando al backend. Verifica que este corriendo en localhost:8080' : 'Cargando...'}
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} saludConnected={saludConnected}>
      {activeTab === 'perfil' && <Profile usuarioId={usuarioId} />}

      {activeTab === 'salud' && (
        <>
          <div style={subTabStyle.container}>
            <button style={{ ...subTabStyle.btn, ...(saludSubTab === 'chat' ? subTabStyle.active : {}) }} onClick={() => setSaludSubTab('chat')}>Chat</button>
            <button style={{ ...subTabStyle.btn, ...(saludSubTab === 'historial' ? subTabStyle.active : {}) }} onClick={() => setSaludSubTab('historial')}>Historial</button>
          </div>
          {saludSubTab === 'chat' && <SaludChat usuarioId={usuarioId} />}
          {saludSubTab === 'historial' && <SaludHistorial usuarioId={usuarioId} />}
        </>
      )}

      {activeTab === 'entrenador' && (
        <>
          {activeWorkout ? (
            <ActiveWorkout rutina={activeWorkout} usuarioId={usuarioId} onFinish={() => { setActiveWorkout(null); setEntrenadorSubTab('historial'); }} />
          ) : (
            <>
              <div style={subTabStyle.container}>
                <button style={{ ...subTabStyle.btn, ...(entrenadorSubTab === 'chat' ? subTabStyle.active : {}) }} onClick={() => setEntrenadorSubTab('chat')}>Chat</button>
                <button style={{ ...subTabStyle.btn, ...(entrenadorSubTab === 'historial' ? subTabStyle.active : {}) }} onClick={() => setEntrenadorSubTab('historial')}>Historial</button>
              </div>
              {entrenadorSubTab === 'chat' && <EntrenadorChat usuarioId={usuarioId} onStartWorkout={setActiveWorkout} />}
              {entrenadorSubTab === 'historial' && <EntrenadorHistorial usuarioId={usuarioId} />}
            </>
          )}
        </>
      )}
    </Layout>
  );
}

export default App;

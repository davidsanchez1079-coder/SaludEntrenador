import { useState, useEffect } from 'react';
import { getUsuario } from './services/api';
import Layout from './components/Layout';
import Profile from './components/Profile';
import SaludChat from './components/SaludChat';
import SaludHistorial from './components/SaludHistorial';
import EntrenadorChat from './components/EntrenadorChat';
import EntrenadorHistorial from './components/EntrenadorHistorial';
import ActiveWorkout from './components/ActiveWorkout';
import './App.css';

const USUARIO_ID = 1;

const subTabStyle = {
  container: { display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid #1e2d27', paddingBottom: '0.5rem' },
  btn: { padding: '0.4rem 1rem', border: 'none', borderRadius: '6px 6px 0 0', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", borderBottom: '2px solid transparent' },
  active: { color: '#4ade80', borderBottomColor: '#4ade80' },
};

function App() {
  const [activeTab, setActiveTab] = useState('perfil');
  const [saludSubTab, setSaludSubTab] = useState('chat');
  const [entrenadorSubTab, setEntrenadorSubTab] = useState('chat');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [saludConnected, setSaludConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getUsuario(USUARIO_ID)
      .then(() => { setLoaded(true); setSaludConnected(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Cargando...
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} saludConnected={saludConnected}>
      {/* PERFIL */}
      {activeTab === 'perfil' && <Profile usuarioId={USUARIO_ID} />}

      {/* SALUD */}
      {activeTab === 'salud' && (
        <>
          <div style={subTabStyle.container}>
            <button style={{ ...subTabStyle.btn, ...(saludSubTab === 'chat' ? subTabStyle.active : {}) }} onClick={() => setSaludSubTab('chat')}>
              Chat
            </button>
            <button style={{ ...subTabStyle.btn, ...(saludSubTab === 'historial' ? subTabStyle.active : {}) }} onClick={() => setSaludSubTab('historial')}>
              Historial
            </button>
          </div>
          {saludSubTab === 'chat' && <SaludChat usuarioId={USUARIO_ID} />}
          {saludSubTab === 'historial' && <SaludHistorial usuarioId={USUARIO_ID} />}
        </>
      )}

      {/* ENTRENADOR */}
      {activeTab === 'entrenador' && (
        <>
          {activeWorkout ? (
            <ActiveWorkout
              rutina={activeWorkout}
              usuarioId={USUARIO_ID}
              onFinish={() => { setActiveWorkout(null); setEntrenadorSubTab('historial'); }}
            />
          ) : (
            <>
              <div style={subTabStyle.container}>
                <button style={{ ...subTabStyle.btn, ...(entrenadorSubTab === 'chat' ? subTabStyle.active : {}) }} onClick={() => setEntrenadorSubTab('chat')}>
                  Chat
                </button>
                <button style={{ ...subTabStyle.btn, ...(entrenadorSubTab === 'historial' ? subTabStyle.active : {}) }} onClick={() => setEntrenadorSubTab('historial')}>
                  Historial
                </button>
              </div>
              {entrenadorSubTab === 'chat' && (
                <EntrenadorChat usuarioId={USUARIO_ID} onStartWorkout={setActiveWorkout} />
              )}
              {entrenadorSubTab === 'historial' && <EntrenadorHistorial usuarioId={USUARIO_ID} />}
            </>
          )}
        </>
      )}
    </Layout>
  );
}

export default App;

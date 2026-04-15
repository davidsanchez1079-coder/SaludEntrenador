import { useState, useEffect } from 'react';
import { getUsuario, createUsuario } from './services/api';
import { getInitialTheme, applyTheme } from './theme';
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
  container: { display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  left: { display: 'flex', gap: '0.25rem' },
  btn: { padding: '0.45rem 1rem', border: 'none', borderRadius: '4px 4px 0 0', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", borderBottom: '2px solid transparent', textTransform: 'uppercase', letterSpacing: '1px' },
  active: { color: 'var(--accent)', borderBottomColor: 'var(--accent)' },
  primary: { padding: '0.55rem 1rem', border: 'none', borderRadius: '6px', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.8px' },
};

async function getOrCreateUsuario() {
  const savedId = localStorage.getItem(STORAGE_KEY);
  if (savedId) {
    try {
      const user = await getUsuario(Number(savedId));
      return user.id;
    } catch {}
  }
  const newUser = await createUsuario({ nombre: 'Mi Perfil' });
  localStorage.setItem(STORAGE_KEY, String(newUser.id));
  return newUser.id;
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [usuarioId, setUsuarioId] = useState(null);
  const [activeTab, setActiveTab] = useState('perfil');
  const [saludSubTab, setSaludSubTab] = useState('chat');
  const [entrenadorSubTab, setEntrenadorSubTab] = useState('chat');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [saludConnected, setSaludConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    getOrCreateUsuario()
      .then((id) => { setUsuarioId(id); setSaludConnected(true); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const startNewWorkout = () => {
    setActiveWorkout(null);
    setEntrenadorSubTab('chat');
    setActiveTab('entrenador');
  };

  if (!loaded || !usuarioId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: "'DM Sans', sans-serif" }}>
        {loaded ? 'Error conectando al servidor. Intenta recargar la pagina.' : 'Cargando...'}
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} saludConnected={saludConnected} theme={theme} onToggleTheme={toggleTheme}>
      {activeTab === 'perfil' && <Profile usuarioId={usuarioId} />}

      {activeTab === 'salud' && (
        <>
          <div style={subTabStyle.container}>
            <div style={subTabStyle.left}>
              <button style={{ ...subTabStyle.btn, ...(saludSubTab === 'chat' ? subTabStyle.active : {}) }} onClick={() => setSaludSubTab('chat')}>Chat</button>
              <button style={{ ...subTabStyle.btn, ...(saludSubTab === 'historial' ? subTabStyle.active : {}) }} onClick={() => setSaludSubTab('historial')}>Historial</button>
            </div>
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
                <div style={subTabStyle.left}>
                  <button style={{ ...subTabStyle.btn, ...(entrenadorSubTab === 'chat' ? subTabStyle.active : {}) }} onClick={() => setEntrenadorSubTab('chat')}>Chat</button>
                  <button style={{ ...subTabStyle.btn, ...(entrenadorSubTab === 'historial' ? subTabStyle.active : {}) }} onClick={() => setEntrenadorSubTab('historial')}>Historial</button>
                </div>
                <button style={subTabStyle.primary} onClick={startNewWorkout}>🔥 Iniciar nuevo entrenamiento</button>
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

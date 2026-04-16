import { useState, useEffect } from 'react';
import { getUsuario, getUsuarioPorCorreo, createUsuario } from './services/api';
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
const STORAGE_EMAIL_KEY = 'saludentrenador_usuario_correo';
const GUEST_KEY = 'saludentrenador_guest_mode';
const AUTOLOGIN_KEY = 'saludentrenador_auto_login';

const alertStyle = {
  marginBottom: '1rem',
  padding: '0.9rem 1rem',
  borderRadius: '10px',
  background: 'rgba(255, 193, 7, 0.12)',
  border: '1px solid rgba(255, 193, 7, 0.35)',
  color: 'var(--text)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.92rem',
  lineHeight: 1.45,
};

const subTabStyle = {
  container: { display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  left: { display: 'flex', gap: '0.25rem' },
  btn: { padding: '0.45rem 1rem', border: 'none', borderRadius: '4px 4px 0 0', background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", borderBottom: '2px solid transparent', textTransform: 'uppercase', letterSpacing: '1px' },
  active: { color: 'var(--accent)', borderBottomColor: 'var(--accent)' },
  primary: { padding: '0.55rem 1rem', border: 'none', borderRadius: '6px', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.8px' },
};

const loginWrap = {
  minHeight: '100vh',
  background: 'var(--bg)',
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  fontFamily: "'DM Sans', sans-serif",
};

const loginCard = {
  width: '100%',
  maxWidth: '460px',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '2rem',
  boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
};

const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '1rem',
  marginTop: '0.75rem',
  marginBottom: '1rem',
  boxSizing: 'border-box',
};

const buttonPrimary = {
  width: '100%',
  padding: '0.9rem 1rem',
  border: 'none',
  borderRadius: '10px',
  background: 'var(--accent)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.92rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginTop: '0.5rem',
};

const buttonSecondary = {
  ...buttonPrimary,
  background: 'transparent',
  color: 'var(--text)',
  border: '1px solid var(--border)',
};

async function cargarUsuarioPorId(id) {
  const user = await getUsuario(Number(id));
  if (user?.correo) localStorage.setItem(STORAGE_EMAIL_KEY, user.correo);
  localStorage.setItem(STORAGE_KEY, String(user.id));
  return user;
}

async function cargarUsuarioPorCorreo(correo) {
  const user = await getUsuarioPorCorreo(correo.trim().toLowerCase());
  localStorage.setItem(STORAGE_KEY, String(user.id));
  localStorage.setItem(STORAGE_EMAIL_KEY, user.correo || correo.trim().toLowerCase());
  localStorage.removeItem(GUEST_KEY);
  return user;
}

async function crearInvitado() {
  const newUser = await createUsuario({ nombre: 'Invitado' });
  localStorage.setItem(STORAGE_KEY, String(newUser.id));
  localStorage.setItem(GUEST_KEY, '1');
  localStorage.setItem(AUTOLOGIN_KEY, '0');
  if (newUser?.correo) localStorage.setItem(STORAGE_EMAIL_KEY, newUser.correo);
  return newUser;
}

function LoginGate({ onLogin }) {
  const [correo, setCorreo] = useState(localStorage.getItem(STORAGE_EMAIL_KEY) || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const entrarConCorreo = async () => {
    const email = correo.trim().toLowerCase();
    if (!email) {
      setError('Escribe tu correo para recuperar tu perfil.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await cargarUsuarioPorCorreo(email);
      localStorage.setItem(AUTOLOGIN_KEY, '1');
      onLogin(user);
    } catch {
      setError('No encontré un perfil con ese correo. Primero créalo o guárdalo en Perfil desde tu sesión principal.');
    } finally {
      setLoading(false);
    }
  };

  const entrarComoInvitado = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await crearInvitado();
      onLogin(user);
    } catch {
      setError('No pude crear modo invitado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={loginWrap}>
      <div style={loginCard}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏋️</div>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Salud Entrenador</h1>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.5, marginTop: '0.75rem' }}>
          Entra con tu correo para recuperar tu perfil, historial y memoria en cualquier dispositivo. O usa invitado si solo quieres probar.
        </p>

        <input
          type="email"
          placeholder="tu correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={inputStyle}
        />

        <button style={buttonPrimary} onClick={entrarConCorreo} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar con correo'}
        </button>
        <button style={buttonSecondary} onClick={entrarComoInvitado} disabled={loading}>
          Entrar como invitado
        </button>

        {error && <p style={{ color: '#ff6b6b', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
      </div>
    </div>
  );
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
  const [usuario, setUsuario] = useState(null);

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    const savedEmail = localStorage.getItem(STORAGE_EMAIL_KEY);
    const autoLogin = localStorage.getItem(AUTOLOGIN_KEY) === '1';

    if (!savedId && !savedEmail) {
      setLoaded(true);
      return;
    }

    if (!autoLogin) {
      setLoaded(true);
      return;
    }

    const init = async () => {
      try {
        let user = null;
        if (savedId) {
          try {
            user = await cargarUsuarioPorId(savedId);
          } catch {}
        }
        if (!user && savedEmail) {
          try {
            user = await cargarUsuarioPorCorreo(savedEmail);
          } catch {}
        }
        if (user) {
          setUsuarioId(user.id);
          setUsuario(user);
          setSaludConnected(true);
        }
      } finally {
        setLoaded(true);
      }
    };

    init();
  }, []);

  const handleLogin = (user) => {
    setUsuarioId(user.id);
    setUsuario(user);
    setSaludConnected(true);
    setLoaded(true);
  };

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const startNewWorkout = () => { setActiveWorkout(null); setEntrenadorSubTab('chat'); setActiveTab('entrenador'); };

  if (!loaded) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: "'DM Sans', sans-serif" }}>Cargando...</div>;
  }

  if (!usuarioId) {
    return <LoginGate onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} saludConnected={saludConnected} theme={theme} onToggleTheme={toggleTheme}>
      {activeTab === 'perfil' && <Profile usuarioId={usuarioId} onProfileSaved={setUsuario} />}
      {activeTab === 'salud' && (<><div style={subTabStyle.container}><div style={subTabStyle.left}><button style={{ ...subTabStyle.btn, ...(saludSubTab === 'chat' ? subTabStyle.active : {}) }} onClick={() => setSaludSubTab('chat')}>Chat</button><button style={{ ...subTabStyle.btn, ...(saludSubTab === 'historial' ? subTabStyle.active : {}) }} onClick={() => setSaludSubTab('historial')}>Historial</button></div></div>{saludSubTab === 'chat' && <SaludChat usuarioId={usuarioId} />}{saludSubTab === 'historial' && <SaludHistorial usuarioId={usuarioId} />}</>)}
      {activeTab === 'entrenador' && (<>{!usuario?.correo && (<div style={alertStyle}><strong>Importante:</strong> para guardar tu información por usuario y no perderla entre dispositivos, entra con tu correo o regístralo en <strong>Perfil</strong>. Si estás como invitado, tu continuidad será limitada.</div>)}{activeWorkout ? (<ActiveWorkout rutina={activeWorkout} usuarioId={usuarioId} onFinish={() => { setActiveWorkout(null); setEntrenadorSubTab('historial'); }} />) : (<><div style={subTabStyle.container}><div style={subTabStyle.left}><button style={{ ...subTabStyle.btn, ...(entrenadorSubTab === 'chat' ? subTabStyle.active : {}) }} onClick={() => setEntrenadorSubTab('chat')}>Chat</button><button style={{ ...subTabStyle.btn, ...(entrenadorSubTab === 'historial' ? subTabStyle.active : {}) }} onClick={() => setEntrenadorSubTab('historial')}>Historial</button></div><button style={subTabStyle.primary} onClick={startNewWorkout}>🔥 Iniciar nuevo entrenamiento</button></div>{entrenadorSubTab === 'chat' && <EntrenadorChat usuarioId={usuarioId} onStartWorkout={setActiveWorkout} />}{entrenadorSubTab === 'historial' && <EntrenadorHistorial usuarioId={usuarioId} />}</>)}</>)}
    </Layout>
  );
}

export default App;

import { useState, useRef, useEffect } from 'react';
import { chatEntrenador } from '../services/api';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LoadingDots from './LoadingDots';
import RoutineCard from './RoutineCard';
import OnboardingEntrenador from './OnboardingEntrenador';

const s = {
  container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' },
  messages: { flex: 1, overflowY: 'auto', paddingBottom: '1rem' },
  welcome: { textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' },
};

// Intenta extraer JSON de un string que puede contener JSON embebido
function extractJSON(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch {}
  // Buscar JSON entre llaves
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(str.slice(start, end + 1)); } catch {}
  }
  return null;
}

export default function EntrenadorChat({ usuarioId, onStartWorkout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text) => {
    const userMsg = { role: 'user', content: text, time: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await chatEntrenador(usuarioId, text);

      let content = res.respuesta || '';
      let rutina = res.rutina || null;
      let consejo = res.consejo || null;

      // Si el content tiene JSON embebido, extraerlo
      if (!rutina && content) {
        const parsed = extractJSON(content);
        if (parsed) {
          if (parsed.respuesta) content = parsed.respuesta;
          if (parsed.rutina) rutina = parsed.rutina;
          if (parsed.consejo) consejo = parsed.consejo;
        }
      }

      // Si rutina es string, parsearlo
      if (typeof rutina === 'string') {
        const pr = extractJSON(rutina);
        if (pr) rutina = pr;
      }

      if (!content) content = 'Sin respuesta';

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content,
        rutina,
        consejo,
        time: new Date().toLocaleTimeString()
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error al comunicarse con el entrenador.', time: new Date().toLocaleTimeString() }]);
    }
    setLoading(false);
  };

  const handleOnboardingComplete = (prompt) => {
    setShowOnboarding(false);
    handleSend(prompt);
  };

  return (
    <div style={s.container}>
      {showOnboarding && <OnboardingEntrenador onComplete={handleOnboardingComplete} />}
      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.welcome}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔥</p>
            <p style={{ fontSize: '1.1rem', color: 'var(--text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Entrenador Personal IA</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Pide una rutina, consejo de entrenamiento o plan nutricional personalizado.</p>
            <button
              onClick={() => setShowOnboarding(true)}
              style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              🏋️ Crear mi Plan Personalizado
            </button>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatBubble role={msg.role} content={msg.content} timestamp={msg.time} />
            {msg.rutina && <RoutineCard rutina={msg.rutina} onStart={() => onStartWorkout && onStartWorkout(msg.rutina)} />}
            {msg.consejo && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: '6px',
                padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>💡 Consejo: </span>{msg.consejo}
              </div>
            )}
          </div>
        ))}
        {loading && <LoadingDots />}
        <div ref={endRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={loading} placeholder="Escribe algo al entrenador..." />
    </div>
  );
}

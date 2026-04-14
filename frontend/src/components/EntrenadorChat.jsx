import { useState, useRef, useEffect } from 'react';
import { chatEntrenador } from '../services/api';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LoadingDots from './LoadingDots';
import RoutineCard from './RoutineCard';

const s = {
  container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' },
  messages: { flex: 1, overflowY: 'auto', paddingBottom: '1rem' },
  welcome: { textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' },
};

export default function EntrenadorChat({ usuarioId, onStartWorkout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text) => {
    const userMsg = { role: 'user', content: text, time: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await chatEntrenador(usuarioId, text);
      let content = res.respuesta || 'Sin respuesta';
      let consejo = res.consejo || null;
      try {
        let raw = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(raw);
        content = parsed.respuesta || content;
      } catch { /* */ }
      if (typeof consejo === 'string') {
        try {
          let raw = consejo.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(raw);
          consejo = parsed.consejo || consejo;
        } catch { /* */ }
      }
      setMessages((prev) => [...prev, { role: 'assistant', content, rutina: res.rutina || null, consejo, time: new Date().toLocaleTimeString() }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error al comunicarse con el entrenador.', time: new Date().toLocaleTimeString() }]);
    }
    setLoading(false);
  };

  return (
    <div style={s.container}>
      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.welcome}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{'\u{1F525}'}</p>
            <p style={{ fontSize: '1.1rem', color: 'var(--text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Entrenador Personal IA</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Pide una rutina, consejo de entrenamiento o plan nutricional personalizado.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatBubble role={msg.role} content={msg.content} timestamp={msg.time} />
            {msg.rutina && <RoutineCard rutina={msg.rutina} onStart={() => onStartWorkout && onStartWorkout(msg.rutina)} />}
            {msg.consejo && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text)' }}>
                <strong style={{ color: 'var(--accent)' }}>{'\u{1F4A1}'} CONSEJO:</strong> {msg.consejo}
              </div>
            )}
          </div>
        ))}
        {loading && <LoadingDots />}
        <div ref={endRef} />
      </div>
      <ChatInput onSend={handleSend} placeholder="Pideme una rutina o consejo..." disabled={loading} />
    </div>
  );
}

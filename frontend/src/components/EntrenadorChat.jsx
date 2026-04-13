import { useState, useRef, useEffect } from 'react';
import { chatEntrenador } from '../services/api';
import { extractReadableText } from '../services/parseUtils';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LoadingDots from './LoadingDots';
import RoutineCard from './RoutineCard';

const s = {
  container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' },
  messages: { flex: 1, overflowY: 'auto', paddingBottom: '1rem' },
  welcome: { textAlign: 'center', padding: '3rem 1rem', color: '#64748b' },
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
      const assistantMsg = {
        role: 'assistant',
        content: extractReadableText(res.respuesta, 'respuesta') || 'Sin respuesta',
        rutina: res.rutina || null,
        consejo: typeof res.consejo === 'string' ? extractReadableText(res.consejo, 'consejo') : (res.consejo || null),
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
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
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{'\u{1F3CB}'}</p>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Entrenador Personal con IA</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Pide una rutina, consejo de entrenamiento o plan nutricional personalizado.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatBubble role={msg.role} content={msg.content} timestamp={msg.time} />
            {msg.rutina && (
              <RoutineCard rutina={msg.rutina} onStart={() => onStartWorkout && onStartWorkout(msg.rutina)} />
            )}
            {msg.consejo && (
              <div style={{ background: '#1a2520', border: '1px solid #2d3a35', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#fbbf24' }}>
                {'\u{1F4A1}'} {msg.consejo}
              </div>
            )}
          </div>
        ))}
        {loading && <LoadingDots />}
        <div ref={endRef} />
      </div>
      <ChatInput onSend={handleSend} color="#60a5fa" placeholder="Pideme una rutina o consejo de entrenamiento..." disabled={loading} />
    </div>
  );
}

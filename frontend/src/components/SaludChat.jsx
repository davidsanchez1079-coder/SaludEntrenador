import { useState, useRef, useEffect } from 'react';
import { chatSalud } from '../services/api';
import { extractReadableText } from '../services/parseUtils';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LoadingDots from './LoadingDots';
import Badge from './Badge';

const s = {
  container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' },
  messages: { flex: 1, overflowY: 'auto', paddingBottom: '1rem' },
  welcome: { textAlign: 'center', padding: '3rem 1rem', color: '#64748b' },
  badgeWrap: { display: 'flex', justifyContent: 'flex-start', marginBottom: '0.25rem' },
};

export default function SaludChat({ usuarioId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text) => {
    const userMsg = { role: 'user', content: text, time: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await chatSalud(usuarioId, text);
      const assistantMsg = {
        role: 'assistant',
        content: extractReadableText(res.respuestaIA, 'respuesta') || 'Sin respuesta',
        categoria: res.categoria,
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error al comunicarse con el servidor.', time: new Date().toLocaleTimeString() }]);
    }
    setLoading(false);
  };

  return (
    <div style={s.container}>
      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.welcome}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{'\u{1FA7A}'}</p>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Asistente de Salud</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Comparte informacion sobre medicamentos, sintomas, medidas, resultados de laboratorio o nutricion.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.categoria && (
              <div style={s.badgeWrap}><Badge categoria={msg.categoria} /></div>
            )}
            <ChatBubble role={msg.role} content={msg.content} timestamp={msg.time} />
          </div>
        ))}
        {loading && <LoadingDots />}
        <div ref={endRef} />
      </div>
      <ChatInput onSend={handleSend} color="#4ade80" placeholder="Describe tu sintoma, medicamento, medida..." disabled={loading} />
    </div>
  );
}

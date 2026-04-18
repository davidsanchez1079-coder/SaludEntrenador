import { useState, useRef, useEffect } from 'react';
import { chatSalud, getHistorialSalud } from '../services/api';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import LoadingDots from './LoadingDots';
import Badge from './Badge';

const s = {
  container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' },
  messages: { flex: 1, overflowY: 'auto', paddingBottom: '1rem' },
  welcome: { textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' },
  badgeWrap: { display: 'flex', justifyContent: 'flex-start', marginBottom: '0.25rem' },
};

export default function SaludChat({ usuarioId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historialCargado, setHistorialCargado] = useState(false);
  const endRef = useRef(null);

  // Cargar historial previo al abrir
  useEffect(() => {
    if (!historialCargado) {
      getHistorialSalud(usuarioId).then((entries) => {
        if (entries && entries.length > 0) {
          const prevMsgs = [];
          const recientes = entries.slice(0, 15).reverse();
          for (const e of recientes) {
            prevMsgs.push({ role: 'user', content: e.textoOriginal || '', categoria: e.categoria, time: e.fecha ? new Date(e.fecha).toLocaleTimeString() : '', _historic: true });
            if (e.respuestaIA) prevMsgs.push({ role: 'assistant', content: e.respuestaIA, categoria: e.categoria, time: e.fecha ? new Date(e.fecha).toLocaleTimeString() : '', _historic: true });
          }
          setMessages(prevMsgs);
        }
        setHistorialCargado(true);
      }).catch(() => setHistorialCargado(true));
    }
  }, [usuarioId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text) => {
    const userMsg = { role: 'user', content: text, time: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await chatSalud(usuarioId, text);
      let content = res.respuestaIA || 'Sin respuesta';
      try {
        let raw = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(raw);
        content = parsed.respuesta || content;
      } catch { /* */ }
      setMessages((prev) => [...prev, { role: 'assistant', content, categoria: res.categoria, time: new Date().toLocaleTimeString() }]);
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
            <p style={{ fontSize: '1.1rem', color: 'var(--text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Asistente de Salud</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Comparte informacion sobre medicamentos, sintomas, medidas, resultados de laboratorio o nutricion.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.categoria && <div style={s.badgeWrap}><Badge categoria={msg.categoria} /></div>}
            <ChatBubble role={msg.role} content={msg.content} timestamp={msg.time} />
          </div>
        ))}
        {loading && <LoadingDots />}
        <div ref={endRef} />
      </div>
      <ChatInput onSend={handleSend} placeholder="Describe tu sintoma, medicamento, medida..." disabled={loading} />
    </div>
  );
}

import { useState } from 'react';

const styles = {
  form: { display: 'flex', gap: '0.5rem', padding: '1rem 0', borderTop: '1px solid var(--border)' },
  textarea: {
    flex: 1, padding: '0.75rem 1rem', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text)', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
    resize: 'none', outline: 'none', minHeight: '44px', maxHeight: '120px', transition: 'border-color 0.2s',
  },
  button: {
    padding: '0 1.5rem', borderRadius: '6px', border: 'none', fontWeight: 700, fontSize: '0.85rem',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap',
    textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--accent)', color: '#fff',
  },
};

export default function ChatInput({ onSend, placeholder = 'Escribe un mensaje...', disabled = false }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) { onSend(text.trim()); setText(''); }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <textarea style={styles.textarea} value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown} placeholder={placeholder} rows={1} disabled={disabled} />
      <button type="submit" disabled={disabled || !text.trim()}
        style={{ ...styles.button, opacity: disabled || !text.trim() ? 0.4 : 1 }}>Enviar</button>
    </form>
  );
}

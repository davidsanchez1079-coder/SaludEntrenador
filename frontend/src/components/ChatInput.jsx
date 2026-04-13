import { useState } from 'react';

const styles = {
  form: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem 0',
    borderTop: '1px solid #1e2d27',
  },
  textarea: {
    flex: 1,
    padding: '0.75rem 1rem',
    background: '#111916',
    border: '1px solid #2d3a35',
    borderRadius: '10px',
    color: '#e0e0e0',
    fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif",
    resize: 'none',
    outline: 'none',
    minHeight: '44px',
    maxHeight: '120px',
  },
  button: {
    padding: '0 1.25rem',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  },
};

export default function ChatInput({ onSend, color = '#4ade80', placeholder = 'Escribe un mensaje...', disabled = false }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <textarea
        style={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        style={{
          ...styles.button,
          background: color,
          color: '#0a0f0d',
          opacity: disabled || !text.trim() ? 0.5 : 1,
        }}
      >
        Enviar
      </button>
    </form>
  );
}

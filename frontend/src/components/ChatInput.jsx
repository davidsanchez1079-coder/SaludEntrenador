import { useState } from 'react';

const styles = {
  form: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem 0',
    borderTop: '1px solid #2a2a2a',
  },
  textarea: {
    flex: 1,
    padding: '0.75rem 1rem',
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#f0f0f0',
    fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif",
    resize: 'none',
    outline: 'none',
    minHeight: '44px',
    maxHeight: '120px',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '0 1.5rem',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};

export default function ChatInput({ onSend, color = '#E53E3E', placeholder = 'Escribe un mensaje...', disabled = false }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

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
        style={{ ...styles.textarea, borderColor: focused ? '#E53E3E' : '#2a2a2a' }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
          color: '#fff',
          opacity: disabled || !text.trim() ? 0.4 : 1,
        }}
      >
        Enviar
      </button>
    </form>
  );
}

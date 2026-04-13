const styles = {
  wrapper: {
    display: 'flex',
    marginBottom: '0.75rem',
  },
  bubble: {
    maxWidth: '80%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  user: {
    background: '#166534',
    color: '#dcfce7',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px',
  },
  assistant: {
    background: '#1e293b',
    color: '#e2e8f0',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px',
  },
  timestamp: {
    fontSize: '0.7rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
};

export default function ChatBubble({ role, content, timestamp }) {
  const isUser = role === 'user';
  return (
    <div style={{ ...styles.wrapper, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div>
        <div style={{ ...styles.bubble, ...(isUser ? styles.user : styles.assistant) }}>
          {content}
        </div>
        {timestamp && (
          <div style={{ ...styles.timestamp, textAlign: isUser ? 'right' : 'left' }}>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

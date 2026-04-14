const styles = {
  wrapper: {
    display: 'flex',
    marginBottom: '0.75rem',
  },
  bubble: {
    maxWidth: '80%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  user: {
    background: '#E53E3E',
    color: '#fff',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px',
  },
  assistant: {
    background: '#1a1a1a',
    color: '#f0f0f0',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px',
    border: '1px solid #2a2a2a',
  },
  timestamp: {
    fontSize: '0.7rem',
    color: '#666',
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

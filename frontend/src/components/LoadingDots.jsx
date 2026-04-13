const keyframes = `
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}`;

export default function LoadingDots() {
  return (
    <>
      <style>{keyframes}</style>
      <div style={{ display: 'flex', gap: '4px', padding: '0.5rem 0', alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#4ade80',
              animation: `bounce 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

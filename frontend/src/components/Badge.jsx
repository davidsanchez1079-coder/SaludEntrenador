const categoryConfig = {
  MEDICAMENTO: { icon: '\u{1F48A}', color: '#f87171', bg: '#1c1517' },
  SINTOMA: { icon: '\u{1FA79}', color: '#fbbf24', bg: '#1c1a13' },
  MEDIDA: { icon: '\u{1F4CF}', color: '#60a5fa', bg: '#131820' },
  LABORATORIO: { icon: '\u{1F9EA}', color: '#a78bfa', bg: '#18131f' },
  BIENESTAR: { icon: '\u{1F33F}', color: '#4ade80', bg: '#0f1a14' },
  NUTRICION: { icon: '\u{1F34E}', color: '#fb923c', bg: '#1c1610' },
};

export default function Badge({ categoria }) {
  const config = categoryConfig[categoria] || categoryConfig.BIENESTAR;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}33`,
      }}
    >
      <span>{config.icon}</span>
      {categoria}
    </span>
  );
}

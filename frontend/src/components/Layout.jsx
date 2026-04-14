const tabs = [
  { id: 'perfil', label: 'Perfil', icon: '\u{1F464}' },
  { id: 'salud', label: 'Salud', icon: '\u{1FA7A}' },
  { id: 'entrenador', label: 'Entrenador', icon: '\u{1F3CB}' },
];

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#f0f0f0',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    background: '#000',
    borderBottom: '1px solid #2a2a2a',
    padding: '0 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  logoIcon: {
    fontSize: '1.6rem',
    color: '#E53E3E',
    filter: 'drop-shadow(0 0 8px rgba(229,62,62,0.5))',
  },
  logoText: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: '#fff',
    margin: 0,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  logoAccent: {
    color: '#E53E3E',
    fontWeight: 800,
  },
  nav: {
    display: 'flex',
    gap: '0.25rem',
  },
  tab: {
    padding: '0.55rem 1rem',
    borderRadius: '4px',
    border: '1px solid transparent',
    background: 'transparent',
    color: '#888',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tabActive: {
    background: 'rgba(229,62,62,0.1)',
    color: '#E53E3E',
    borderColor: 'rgba(229,62,62,0.3)',
  },
  badge: {
    background: '#E53E3E',
    color: '#fff',
    fontSize: '0.6rem',
    padding: '1px 6px',
    borderRadius: '2px',
    fontWeight: 700,
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '1.5rem',
  },
};

export default function Layout({ activeTab, onTabChange, saludConnected, children }) {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>{'\u{1F525}'}</span>
          <h1 style={styles.logoText}>
            La <span style={styles.logoAccent}>Chingada</span> Fitness
          </h1>
        </div>
        <nav style={styles.nav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'entrenador' && saludConnected && (
                <span style={styles.badge}>ON</span>
              )}
            </button>
          ))}
        </nav>
      </header>
      <main style={styles.content}>{children}</main>
    </div>
  );
}

const tabs = [
  { id: 'perfil', label: 'Perfil', icon: '\u{1F464}' },
  { id: 'salud', label: 'Salud', icon: '\u{1FA7A}' },
  { id: 'entrenador', label: 'Entrenador', icon: '\u{1F3CB}' },
];

const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.2s, color 0.2s',
  },
  header: {
    background: 'var(--header-bg)',
    borderBottom: '1px solid var(--border)',
    padding: '0 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  logoIcon: {
    fontSize: '1.6rem',
    color: 'var(--accent)',
    filter: 'drop-shadow(0 0 8px rgba(229,62,62,0.4))',
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--text)',
    margin: 0,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  logoAccent: { color: 'var(--accent)', fontWeight: 800 },
  right: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  nav: { display: 'flex', gap: '0.25rem' },
  tab: {
    padding: '0.55rem 1rem',
    borderRadius: '4px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-dim)',
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
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    borderColor: 'var(--accent-border)',
  },
  badge: {
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '0.6rem',
    padding: '1px 6px',
    borderRadius: '2px',
    fontWeight: 700,
  },
  themeBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    cursor: 'pointer',
    padding: '0.45rem 0.6rem',
    borderRadius: '4px',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    transition: 'all 0.2s',
  },
  content: { maxWidth: '900px', margin: '0 auto', padding: '1.5rem' },
};

export default function Layout({ activeTab, onTabChange, saludConnected, theme, onToggleTheme, children }) {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>{'\u{1F525}'}</span>
          <h1 style={styles.logoText}>
            La <span style={styles.logoAccent}>Chingada</span> Fitness
          </h1>
        </div>
        <div style={styles.right}>
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
          <button
            onClick={onToggleTheme}
            style={styles.themeBtn}
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? '\u2600\uFE0F' : '\u{1F319}'}
          </button>
        </div>
      </header>
      <main style={styles.content}>{children}</main>
    </div>
  );
}

import { useState } from 'react';

const tabs = [
  { id: 'perfil', label: 'Perfil', icon: '\u{1F464}' },
  { id: 'salud', label: 'Salud', icon: '\u{1FA7A}' },
  { id: 'entrenador', label: 'Entrenador', icon: '\u{1F3CB}' },
];

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0f0d',
    color: '#e0e0e0',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    background: '#111916',
    borderBottom: '1px solid #1e2d27',
    padding: '0 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    fontSize: '1.5rem',
    color: '#4ade80',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  nav: {
    display: 'flex',
    gap: '0.25rem',
  },
  tab: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#1a2f24',
    color: '#4ade80',
  },
  badge: {
    background: '#4ade80',
    color: '#0a0f0d',
    fontSize: '0.6rem',
    padding: '1px 5px',
    borderRadius: '8px',
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
          <span style={styles.logoIcon}>{'\u2764'}</span>
          <h1 style={styles.logoText}>SaludEntrenador</h1>
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
                <span style={styles.badge}>Salud</span>
              )}
            </button>
          ))}
        </nav>
      </header>
      <main style={styles.content}>{children}</main>
    </div>
  );
}

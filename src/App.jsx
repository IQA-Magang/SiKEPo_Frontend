import { useState } from 'react';

const menuItems = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Data Alat', icon: '▤' },
  { label: 'Peminjaman', icon: '⇄' },
  { label: 'Kalibrasi', icon: '◷' },
];

const stats = [
  { label: 'Total Alat', value: '302', tone: 'blue' },
  { label: 'Tersedia', value: '250', tone: 'green' },
  { label: 'Dipinjam', value: '35', tone: 'purple' },
  { label: 'Tidak Layak', value: '17', tone: 'red' },
];

function App() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark" aria-hidden="true"><span>◇</span></div>
          <span className="brand-name">Logo</span>
        </div>
        <div className="page-title">{activeMenu}</div>
        <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}>
          <span className="user-icon">♟</span> Admin <span className="chevron">⌄</span>
        </button>
        {profileOpen && <div className="profile-menu"><strong>Admin</strong><span>Keluar</span></div>}
      </header>

      <aside className="sidebar">
        <nav aria-label="Navigasi utama">
          {menuItems.map((item) => (
            <button
              className={`nav-item ${activeMenu === item.label ? 'active' : ''}`}
              key={item.label}
              onClick={() => setActiveMenu(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">SIKEPO v1.0</div>
      </aside>

      <main className="main-content">
        <section className="welcome">
          <h1>{activeMenu}</h1>
          <p>Selamat datang, <span>[Nama Pengguna]</span></p>
        </section>

        {activeMenu === 'Dashboard' ? (
          <>
            <section className="stats-grid" aria-label="Ringkasan alat">
              {stats.map((stat) => (
                <article className={`stat-card ${stat.tone}`} key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </section>

            <section className="dashboard-grid">
              <article className="panel status-panel">
                <h2>Status Alat</h2>
                <div className="chart-placeholder">
                  <div className="chart-grid-lines"><i /><i /><i /><i /></div>
                  <div className="chart-bars"><b style={{ height: '48%' }} /><b style={{ height: '72%' }} /><b style={{ height: '58%' }} /><b style={{ height: '86%' }} /><b style={{ height: '64%' }} /><b style={{ height: '92%' }} /></div>
                  <span className="chart-caption">Grafik ketersediaan alat</span>
                </div>
                <div className="chart-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span></div>
              </article>

              <article className="panel due-panel">
                <h2>Jatuh Tempo Kalibrasi</h2>
                <div className="legend-list">
                  <div><i className="dot today" /><span>Hari ini</span><strong>4 alat</strong></div>
                  <div><i className="dot week" /><span>&le; 7 hari</span><strong>12 alat</strong></div>
                  <div><i className="dot month" /><span>&le; 30 hari</span><strong>28 alat</strong></div>
                </div>
              </article>
            </section>
          </>
        ) : (
          <section className="empty-state panel">
            <div className="empty-icon">{menuItems.find((item) => item.label === activeMenu)?.icon}</div>
            <h2>{activeMenu}</h2>
            <p>Modul {activeMenu.toLowerCase()} siap dikembangkan.</p>
            <button onClick={() => setActiveMenu('Dashboard')}>Kembali ke dashboard</button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
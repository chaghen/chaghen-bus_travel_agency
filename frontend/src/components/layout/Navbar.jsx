import { useState } from 'react';
import { useApp } from '../../App.jsx';
import LoginModal from '../LoginModal.jsx';

export default function Navbar() {
  const { page, nav, user, logout } = useApp();
  const [showLogin, setShowLogin] = useState(false);

  const links = [
    { id: 'home',   label: '🏠 Accueil' },
    { id: 'search', label: '🎫 Réserver' },
    { id: 'board',  label: '🕐 Tableau' },
  ];

  // Liens selon le rôle — admin et agency_admin voient leur dashboard
  // Les rôles sont déterminés par le JWT, pas hardcodés
  if (user?.role === 'agency_admin' || user?.role === 'admin') {
    links.push({ id: 'agency', label: '📊 Dashboard' });
  }
  if (user?.role === 'admin') {
    links.push({ id: 'admin', label: '⚙️ Admin' });
  }

  const roleBadge = {
    admin:        { label: 'ADMIN',  bg: '#dc2626' },
    agency_admin: { label: 'AGENCE', bg: 'var(--primary)' },
    user:         { label: 'COMPTE', bg: '#16a34a' },
  }[user?.role];

  return (
    <>
      <nav style={{
        background: '#fff', borderBottom: '1px solid var(--slate-200)',
        position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 60 }}>
          {/* Logo */}
          <button onClick={() => nav('home')} style={{ display:'flex', alignItems:'center', gap:10, background:'none', padding:0, marginRight:40, cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚌</div>
            <div>
              <div style={{ fontWeight:800, fontSize:17, color:'var(--primary-dark)', lineHeight:1.1 }}>BusExpress</div>
              <div style={{ fontSize:10, color:'var(--slate-400)', lineHeight:1 }}>Voyages Confortables</div>
            </div>
          </button>

          {/* Nav links */}
          <div style={{ display:'flex', gap:4, flex:1 }}>
            {links.map(l => (
              <button key={l.id} onClick={() => nav(l.id)} style={{
                padding:'6px 14px', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer',
                background: page===l.id ? 'var(--primary-50)' : 'none',
                color:      page===l.id ? 'var(--primary)' : 'var(--slate-600)',
                border:     page===l.id ? '1px solid var(--primary-100)' : '1px solid transparent',
                transition: 'all .15s',
              }}>{l.label}</button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {user ? (
              <>
                <span style={{ fontSize:13, color:'var(--slate-600)', fontWeight:500 }}>{user.name}</span>
                {roleBadge && (
                  <span style={{ background:roleBadge.bg, color:'#fff', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, letterSpacing:'.5px' }}>
                    {roleBadge.label}
                  </span>
                )}
                <button onClick={logout} style={{ padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:600, border:'1px solid var(--slate-200)', background:'#fff', color:'var(--slate-700)', cursor:'pointer' }}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <button onClick={() => nav('register-user')} style={{ padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600, border:'1px solid var(--slate-200)', background:'#fff', color:'var(--slate-600)', cursor:'pointer' }}>
                  Créer un compte
                </button>
                <button onClick={() => nav('register')} style={{ padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:600, border:'1.5px solid var(--primary)', background:'#fff', color:'var(--primary)', cursor:'pointer' }}>
                  🚌 Agence
                </button>
                <button onClick={() => setShowLogin(true)} style={{ padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:600, background:'var(--primary)', color:'#fff', cursor:'pointer' }}>
                  Connexion
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

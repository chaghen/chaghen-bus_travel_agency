import { useState } from 'react';
import { useApp } from '../App.jsx';
import { api } from '../services/api.js';

export default function LoginModal({ onClose }) {
  const { login, loginAsUser, nav } = useApp();
  const [tab, setTab]           = useState('agency'); // 'agency' | 'user'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const agencyDemos = [
    { label: 'TransExpress',   email: 'contact@transexpress.fr',  pw: 'password123' },
    { label: 'Riviera Bus',    email: 'info@rivierabus.fr',       pw: 'password123' },
    { label: 'Atlantic Lines', email: 'contact@atlanticlines.fr', pw: 'password123' },
  ];
  const userDemos = [
    { label: 'Jean Dupont',   email: 'jean.dupont@example.fr',   pw: 'password123' },
    { label: 'Marie Martin',  email: 'marie.martin@example.fr',  pw: 'password123' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'agency') {
        await login(email, password);
        onClose();
        nav('agency');
      } else {
        await loginAsUser(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally { setLoading(false); }
  };

  const fill = (d) => { setEmail(d.email); setPassword(d.pw); };

  const tabBtn = (id, label) => (
    <button onClick={() => { setTab(id); setEmail(''); setPassword(''); setError(''); }} style={{
      flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      background: 'none', border: 'none',
      color: tab === id ? 'var(--primary)' : 'var(--slate-400)',
      borderBottom: `2px solid ${tab === id ? 'var(--primary)' : 'transparent'}`,
    }}>{label}</button>
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', padding: '24px 24px 16px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚌</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--slate-800)' }}>Connexion BusExpress</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--slate-100)', margin: '0 24px' }}>
          {tabBtn('user',   '👤 Voyageur')}
          {tabBtn('agency', '🚌 Agence / Admin')}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Comptes démo */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--slate-400)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Comptes démo
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(tab === 'agency' ? agencyDemos : userDemos).map(d => (
                <button key={d.email} onClick={() => fill(d)} style={{
                  textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 12,
                  border: '1px solid var(--slate-200)', background: 'var(--slate-50)',
                  color: 'var(--slate-700)', fontWeight: 500, cursor: 'pointer',
                }}>{d.label}</button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lblStyle}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" placeholder={tab === 'agency' ? 'contact@agence.fr' : 'vous@example.fr'} required
                style={inpStyle} />
            </div>
            <div>
              <label style={lblStyle}>Mot de passe</label>
              <input value={password} onChange={e => setPassword(e.target.value)}
                type="password" placeholder="••••••••" required style={inpStyle} />
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{
              padding: '12px', borderRadius: 8, background: 'var(--primary)', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1,
            }}>
              {loading ? 'Connexion…' : tab === 'agency' ? 'Accéder au dashboard' : 'Se connecter'}
            </button>
          </form>

          {/* Liens inscription */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--slate-100)' }}>
            {tab === 'user' ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 8 }}>Pas encore de compte voyageur ?</p>
                <button onClick={() => { onClose(); nav('register-user'); }} style={{
                  width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: '1.5px solid var(--primary)', background: 'var(--primary-50)', color: 'var(--primary)', cursor: 'pointer',
                }}>Créer un compte gratuit</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 8 }}>Votre agence n'est pas encore inscrite ?</p>
                <button onClick={() => { onClose(); nav('register'); }} style={{
                  width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: '1.5px solid var(--primary)', background: 'var(--primary-50)', color: 'var(--primary)', cursor: 'pointer',
                }}>🚌 Inscrire mon agence</button>
              </div>
            )}
          </div>

          <button onClick={onClose} style={{
            marginTop: 10, width: '100%', padding: '8px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--slate-200)', color: 'var(--slate-500)', background: 'none', cursor: 'pointer',
          }}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

const lblStyle = { fontSize: 13, fontWeight: 600, color: 'var(--slate-700)', display: 'block', marginBottom: 4 };
const inpStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, border: '1.5px solid var(--slate-200)', background: 'var(--slate-50)', boxSizing: 'border-box' };

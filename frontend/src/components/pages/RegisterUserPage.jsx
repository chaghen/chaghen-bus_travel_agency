import { useState } from 'react';
import { useApp } from '../../App.jsx';
import { api } from '../../services/api.js';

export default function RegisterUserPage() {
  const { nav } = useApp();
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '', phone: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError('Mot de passe trop court (8 car. min.)');
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas');
    setError(''); setLoading(true);
    try {
      await api.registerUser({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone || null });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally { setLoading(false); }
  };

  if (step === 2) return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="slide-up" style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--slate-800)', marginBottom: 12 }}>Compte créé !</h1>
        <p style={{ fontSize: 15, color: 'var(--slate-500)', marginBottom: 32, lineHeight: 1.7 }}>
          Bienvenue <strong>{form.firstName}</strong> ! Vous pouvez maintenant vous connecter et réserver vos voyages.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => nav('home')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--slate-200)', background: '#fff', color: 'var(--slate-700)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Retour accueil</button>
          <button onClick={() => nav('search')} style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Rechercher un voyage →</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-50)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #0ea5e9 100%)', padding: '48px 24px 64px', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px' }}>Créer un compte voyageur</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)' }}>Réservez plus vite, suivez vos voyages, auto-complétion à la réservation.</p>
      </div>

      <div style={{ maxWidth: 480, margin: '-32px auto 64px', padding: '0 24px' }}>
        <div className="slide-up" style={{ background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
          <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <F label="Prénom" value={form.firstName} onChange={v => set('firstName', v)} placeholder="Jean" />
              <F label="Nom" value={form.lastName} onChange={v => set('lastName', v)} placeholder="Dupont" />
            </div>
            <div style={{ marginBottom: 14 }}><F label="Email *" type="email" value={form.email} onChange={v => set('email', v)} placeholder="jean@example.fr" /></div>
            <div style={{ marginBottom: 14 }}><F label="Téléphone" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="06 12 34 56 78" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              <F label="Mot de passe *" type="password" value={form.password} onChange={v => set('password', v)} placeholder="••••••••" />
              <F label="Confirmer *" type="password" value={form.confirm} onChange={v => set('confirm', v)} placeholder="••••••••" />
            </div>
            {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 10, background: loading ? 'var(--slate-300)' : 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Création...' : '✅ Créer mon compte'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--slate-500)' }}>
              Déjà un compte ?{' '}
              <button type="button" onClick={() => nav('home')} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                Se connecter
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function F({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, border: '1.5px solid var(--slate-200)', background: 'var(--slate-50)', boxSizing: 'border-box' }} />
    </div>
  );
}

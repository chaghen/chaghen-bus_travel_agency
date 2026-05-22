import { useState } from 'react';
import { useApp } from '../../App.jsx';
import { api } from '../../services/api.js';

const CITIES = [
  'Paris','Lyon','Marseille','Bordeaux','Toulouse','Nice','Nantes',
  'Strasbourg','Montpellier','Lille','Rennes','Grenoble','Dijon',
  'Angers','Nîmes','Toulon','Le Havre','Saint-Étienne','Reims','Metz',
];

export default function RegisterPage() {
  const { nav } = useApp();

  const [step, setStep]       = useState(1); // 1=infos, 2=succès
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    name:        '',
    email:       '',
    password:    '',
    confirm:     '',
    phone:       '',
    city:        '',
    description: '',
    siret:       '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.name.trim())               return 'Le nom de l\'agence est requis';
    if (!form.email.trim())              return 'L\'email est requis';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Email invalide';
    if (form.password.length < 8)        return 'Le mot de passe doit faire au moins 8 caractères';
    if (form.password !== form.confirm)  return 'Les mots de passe ne correspondent pas';
    if (!form.city)                      return 'La ville est requise';
    if (form.siret && form.siret.replace(/\s/g, '').length !== 14)
      return 'Le SIRET doit contenir 14 chiffres';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    setError(''); setLoading(true);
    try {
      await api.register({
        name:        form.name.trim(),
        email:       form.email.trim().toLowerCase(),
        password:    form.password,
        phone:       form.phone.trim() || null,
        city:        form.city,
        description: form.description.trim() || null,
        siret:       form.siret.replace(/\s/g, '') || null,
      });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // ── Succès ──────────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="slide-up" style={{
          background: '#fff', borderRadius: 20, padding: '48px 40px',
          maxWidth: 520, width: '100%', textAlign: 'center',
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--slate-200)',
        }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--slate-800)', marginBottom: 12 }}>
            Inscription envoyée !
          </h1>
          <p style={{ fontSize: 15, color: 'var(--slate-500)', lineHeight: 1.7, marginBottom: 32 }}>
            Votre agence <strong style={{ color: 'var(--slate-700)' }}>{form.name}</strong> a bien été enregistrée.
            Elle sera visible sur la plateforme dès validation par notre équipe (sous 24h).
          </p>

          <div style={{
            background: 'var(--primary-50)', border: '1px solid var(--primary-100)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 32, textAlign: 'left',
          }}>
            {[
              ['Email', form.email],
              ['Ville', form.city],
              ['Statut', 'En attente de validation'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                <span style={{ color: 'var(--slate-500)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => nav('home')} style={{
              flex: 1, padding: '12px', borderRadius: 10,
              border: '1px solid var(--slate-200)', background: '#fff',
              color: 'var(--slate-700)', fontWeight: 600, fontSize: 14,
            }}>
              Retour à l'accueil
            </button>
            <button onClick={() => nav('search')} style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: 'var(--primary)', color: '#fff',
              fontWeight: 700, fontSize: 14,
            }}>
              Explorer les voyages
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-50)' }}>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #0ea5e9 100%)',
        padding: '48px 24px 64px',
        textAlign: 'center',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚌</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: '-1px' }}>
            Rejoignez BusExpress
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', maxWidth: 480, margin: '0 auto' }}>
            Publiez vos voyages, gérez vos réservations et touchez des milliers de voyageurs.
          </p>

          {/* Avantages */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
            {[
              ['🎯', 'Visibilité', 'Accédez à +50k voyageurs/mois'],
              ['⚡', 'Temps réel', 'Gérez vos statuts en direct'],
              ['📊', 'Dashboard', 'Tableau de bord complet'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ textAlign: 'center', maxWidth: 160 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div style={{ maxWidth: 640, margin: '-32px auto 64px', padding: '0 24px' }}>
        <div className="slide-up" style={{
          background: '#fff', borderRadius: 20,
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--slate-200)',
          overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--slate-100)' }}>
            <div style={{
              flex: 1, padding: '16px', textAlign: 'center', fontSize: 13, fontWeight: 600,
              color: 'var(--primary)', borderBottom: '2px solid var(--primary)',
            }}>
              Créer un compte agence
            </div>
            <button onClick={() => nav('home')} style={{
              flex: 1, padding: '16px', textAlign: 'center', fontSize: 13, fontWeight: 500,
              color: 'var(--slate-400)', background: 'none', border: 'none', borderBottom: '2px solid transparent',
              cursor: 'pointer',
            }}>
              Déjà un compte ? Se connecter
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '32px' }}>

            {/* ── Section 1 : Identité ── */}
            <SectionTitle icon="🏢" label="Informations de l'agence" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field
                label="Nom de l'agence *"
                value={form.name}
                onChange={v => set('name', v)}
                placeholder="ex: TransExpress"
                autoFocus
              />
              <div>
                <label style={labelStyle}>Ville *</label>
                <select value={form.city} onChange={e => set('city', e.target.value)} style={inputStyle}>
                  <option value="">Sélectionner...</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <Field
                label="Description"
                value={form.description}
                onChange={v => set('description', v)}
                placeholder="Décrivez votre agence en quelques mots..."
                multiline
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              <Field
                label="Téléphone"
                value={form.phone}
                onChange={v => set('phone', v)}
                placeholder="01 23 45 67 89"
                type="tel"
              />
              <Field
                label="SIRET (14 chiffres)"
                value={form.siret}
                onChange={v => set('siret', v)}
                placeholder="123 456 789 00012"
                maxLength={17}
              />
            </div>

            {/* ── Section 2 : Connexion ── */}
            <SectionTitle icon="🔐" label="Identifiants de connexion" />

            <div style={{ marginBottom: 14 }}>
              <Field
                label="Adresse email *"
                value={form.email}
                onChange={v => set('email', v)}
                placeholder="contact@monagence.fr"
                type="email"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
              <Field
                label="Mot de passe * (8 car. min.)"
                value={form.password}
                onChange={v => set('password', v)}
                placeholder="••••••••"
                type="password"
              />
              <Field
                label="Confirmer le mot de passe *"
                value={form.confirm}
                onChange={v => set('confirm', v)}
                placeholder="••••••••"
                type="password"
              />
            </div>

            {/* Password strength */}
            {form.password && <PasswordStrength password={form.password} />}

            {/* Info statut */}
            <div style={{
              background: '#fef3c7', border: '1px solid #fde68a',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
              <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
                Votre agence sera créée avec le statut <strong>En attente</strong>.
                Elle sera activée par notre équipe sous 24h, puis visible sur la plateforme.
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10,
                padding: '12px 16px', marginBottom: 16,
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <span>❌</span>
                <p style={{ fontSize: 13, color: '#dc2626', margin: 0, fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 10,
              background: loading ? 'var(--slate-300)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: '#fff', fontWeight: 800, fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,.35)',
              transition: 'all .2s',
            }}>
              {loading ? '⏳ Inscription en cours...' : '🚀 Créer mon compte agence'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--slate-400)', marginTop: 16 }}>
              En vous inscrivant, vous acceptez nos conditions d'utilisation.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Composants helper ──────────────────────────────────────────────────────────

function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-700)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--slate-200)', marginLeft: 4 }} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, multiline, autoFocus, maxLength }) {
  const style = { ...inputStyle };
  if (multiline) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...style, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
    );
  }
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        style={style}
      />
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: '8 caractères',   ok: password.length >= 8 },
    { label: 'Majuscule',      ok: /[A-Z]/.test(password) },
    { label: 'Chiffre',        ok: /[0-9]/.test(password) },
    { label: 'Caractère spécial', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#dc2626', '#f97316', '#f59e0b', '#22c55e'];
  const labels = ['Très faible', 'Faible', 'Correct', 'Fort'];

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < score ? colors[score - 1] : 'var(--slate-200)',
            transition: 'background .2s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {checks.map(c => (
            <span key={c.label} style={{
              fontSize: 11, fontWeight: 500,
              color: c.ok ? '#16a34a' : 'var(--slate-400)',
            }}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: colors[score - 1] }}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: 'var(--slate-600)',
  display: 'block', marginBottom: 5, letterSpacing: '.3px',
};

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
  border: '1.5px solid var(--slate-200)', background: 'var(--slate-50)',
  color: 'var(--slate-800)', transition: 'border-color .15s',
  boxSizing: 'border-box',
};

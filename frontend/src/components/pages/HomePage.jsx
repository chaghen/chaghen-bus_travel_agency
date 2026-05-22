import { useState } from 'react';
import { useApp } from '../../App.jsx';

const CITIES = ['Paris','Lyon','Marseille','Bordeaux','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Lille','Rennes','Grenoble'];

export default function HomePage() {
  const { nav, setSearchParams, agencies, trips } = useApp();
  const [form, setForm] = useState({
    fromCity: 'Paris',
    toCity: 'Lyon',
    date: '',
    passengers: '1',
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ fromCity: form.fromCity, toCity: form.toCity, date: form.date });
    nav('search');
  };

  const activeAgencies = agencies.filter(a => a.status !== 'inactive');

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #0ea5e9 100%)',
        color: '#fff',
        padding: '72px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-80, right:-80, width:400, height:400, borderRadius:'50%', background:'rgba(255,255,255,.05)' }} />
        <div style={{ position:'absolute', bottom:-120, left:-60, width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,.04)' }} />

        <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 420px', gap:60, alignItems:'center', position:'relative', zIndex:1 }}>
          {/* Left */}
          <div>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,.15)', backdropFilter:'blur(8px)',
              border:'1px solid rgba(255,255,255,.2)', borderRadius:20,
              padding:'6px 14px', fontSize:13, fontWeight:500, marginBottom:28,
            }}>
              ⭐ 4.8 · Plus de 50 000 voyageurs par mois
            </div>

            <h1 style={{ fontSize:52, fontWeight:800, lineHeight:1.15, marginBottom:20, letterSpacing:'-1px' }}>
              Voyagez en toute<br />
              <span style={{ color:'#fbbf24' }}>sérénité</span>
            </h1>

            <p style={{ fontSize:17, lineHeight:1.7, color:'rgba(255,255,255,.85)', maxWidth:480, marginBottom:36 }}>
              Découvrez la France avec BusExpress. Confort, ponctualité
              et sécurité pour tous vos voyages vers plus de 100 destinations.
            </p>

            <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:48 }}>
              <button onClick={() => nav('search')} style={{
                padding:'13px 28px', borderRadius:10, background:'#fff',
                color:'var(--primary-dark)', fontWeight:700, fontSize:15,
                display:'flex', alignItems:'center', gap:8,
                boxShadow:'0 4px 20px rgba(0,0,0,.2)',
              }}>
                📍 Réserver maintenant →
              </button>
              <button onClick={() => nav('board')} style={{
                padding:'13px 28px', borderRadius:10, background:'transparent',
                color:'#fff', fontWeight:600, fontSize:15,
                border:'2px solid rgba(255,255,255,.5)',
              }}>
                🕐 Voir les horaires
              </button>
            </div>

            {/* Stats */}
            <div style={{ display:'flex', gap:40 }}>
              {[['100+','Destinations'],['50k+','Voyageurs/mois'],['4.8★','Satisfaction']].map(([v,l]) => (
                <div key={l}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#fbbf24', letterSpacing:'-1px' }}>{v}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: search card */}
          <div style={{
            background:'rgba(255,255,255,.12)', backdropFilter:'blur(16px)',
            border:'1px solid rgba(255,255,255,.2)', borderRadius:20, padding:32,
          }}>
            <h3 style={{ fontSize:20, fontWeight:700, marginBottom:24 }}>Réservation Express</h3>
            <form onSubmit={handleSearch} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,.8)' }}>Départ</label>
                  <select value={form.fromCity} onChange={e => setForm(f => ({...f, fromCity:e.target.value}))} style={selectStyle}>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,.8)' }}>Arrivée</label>
                  <select value={form.toCity} onChange={e => setForm(f => ({...f, toCity:e.target.value}))} style={selectStyle}>
                    <option value="">Toutes</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,.8)' }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))}
                    min={new Date().toISOString().slice(0,10)} style={selectStyle} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:6, color:'rgba(255,255,255,.8)' }}>Passagers</label>
                  <select value={form.passengers} onChange={e => setForm(f => ({...f, passengers:e.target.value}))} style={selectStyle}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} adulte{n>1?'s':''}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" style={{
                padding:'14px', borderRadius:10, background:'#f59e0b',
                color:'#000', fontWeight:800, fontSize:15, marginTop:4,
                boxShadow:'0 4px 16px rgba(245,158,11,.4)',
              }}>
                Rechercher
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Agences ─────────────────────────────────────────────────────────── */}
      {activeAgencies.length > 0 && (
        <section style={{ maxWidth:1200, margin:'64px auto', padding:'0 24px' }}>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--slate-800)', marginBottom:8 }}>Nos Agences Partenaires</h2>
          <p style={{ color:'var(--slate-500)', marginBottom:32 }}>Des opérateurs de confiance sélectionnés pour leur qualité de service</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:20 }}>
            {activeAgencies.map(a => (
              <div key={a.id} style={{
                background:'#fff', border:'1px solid var(--slate-200)', borderRadius:14, padding:24,
                boxShadow:'var(--shadow)', transition:'all .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{
                    width:48, height:48, borderRadius:12,
                    background:`linear-gradient(135deg, ${a.colors?.primary||'#2563eb'}, ${a.colors?.secondary||'#0ea5e9'})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontWeight:800, fontSize:20,
                  }}>
                    {a.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--slate-800)' }}>{a.name}</div>
                    <div style={{ fontSize:12, color:'var(--slate-400)' }}>📍 {a.city}</div>
                  </div>
                </div>
                {a.rating && (
                  <div style={{ fontSize:13, color:'var(--slate-600)', marginBottom:10 }}>
                    ⭐ <strong>{a.rating}</strong> · {a.tripsCount || 0} voyage{a.tripsCount !== 1 ? 's' : ''}
                  </div>
                )}
                {a.description && (
                  <p style={{ fontSize:13, color:'var(--slate-500)', lineHeight:1.5 }}>{a.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Why BusExpress ──────────────────────────────────────────────────── */}
      <section style={{ background:'var(--slate-50)', padding:'64px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--slate-800)', marginBottom:8, textAlign:'center' }}>Pourquoi BusExpress ?</h2>
          <p style={{ color:'var(--slate-500)', marginBottom:48, textAlign:'center' }}>La plateforme de référence pour vos voyages en bus</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:24 }}>
            {[
              { icon:'⚡', title:'Temps réel', desc:'Tableau de bord en temps réel avec mises à jour instantanées des statuts.' },
              { icon:'🔒', title:'Réservation sécurisée', desc:'Paiement sécurisé et confirmation immédiate par référence unique.' },
              { icon:'🚌', title:'Multi-agences', desc:'Comparez les offres de plusieurs agences sur une seule plateforme.' },
              { icon:'🌟', title:'Bus VIP', desc:'Voyagez en classe VIP avec sièges premium et services à bord.' },
            ].map(f => (
              <div key={f.title} style={{ background:'#fff', borderRadius:14, padding:28, border:'1px solid var(--slate-200)', boxShadow:'var(--shadow)', textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:14 }}>{f.icon}</div>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:8, color:'var(--slate-800)' }}>{f.title}</h3>
                <p style={{ fontSize:13, color:'var(--slate-500)', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live board CTA ──────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', padding:'48px 24px', textAlign:'center', color:'#fff' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>🕐</div>
          <h2 style={{ fontSize:26, fontWeight:800, marginBottom:12 }}>Tableau des départs en temps réel</h2>
          <p style={{ color:'rgba(255,255,255,.8)', marginBottom:28, fontSize:15 }}>Consultez tous les départs en direct depuis notre gare routière</p>
          <button onClick={() => nav('board')} style={{
            padding:'13px 32px', borderRadius:10, background:'#fff',
            color:'var(--primary-dark)', fontWeight:700, fontSize:15,
          }}>Voir le tableau de bord →</button>
        </div>
      </section>
    </div>
  );
}

const selectStyle = {
  width:'100%', padding:'10px 12px', borderRadius:8, fontSize:13,
  border:'1px solid rgba(255,255,255,.3)', background:'rgba(255,255,255,.15)',
  color:'#fff', appearance:'auto',
};

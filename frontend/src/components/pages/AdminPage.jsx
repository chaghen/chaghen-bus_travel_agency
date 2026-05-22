import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../App.jsx';
import { api } from '../../services/api.js';

const STATUS_CFG = {
  active:   { label:'Active',      bg:'#16a34a', light:'#dcfce7' },
  pending:  { label:'En attente',  bg:'#d97706', light:'#fef3c7' },
  inactive: { label:'Inactive',    bg:'#dc2626', light:'#fee2e2' },
};

export default function AdminPage() {
  const { user } = useApp();
  const [agencies, setAgencies] = useState([]);
  const [trips, setTrips]       = useState([]);
  const [tab, setTab]           = useState('pending');
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id en cours

  const load = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const [ag, tr] = await Promise.all([
        api.adminGetAgencies(user.token),
        api.searchTrips({}),
      ]);
      setAgencies(ag);
      setTrips(tr);
    } catch (e) {
      console.error('AdminPage load error:', e);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const action = async (fn, id) => {
    setActionLoading(id);
    try {
      const updated = await fn(id, user.token);
      setAgencies(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    } catch (e) { alert(e.message || 'Erreur'); }
    finally { setActionLoading(null); }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'var(--slate-500)' }}>
        <div style={{ fontSize:60 }}>🔒</div>
        <h2 style={{ fontWeight:700, color:'var(--slate-700)', fontSize:22 }}>Accès réservé aux administrateurs</h2>
        <p style={{ fontSize:14 }}>Connectez-vous avec un compte admin.</p>
      </div>
    );
  }

  const pending  = agencies.filter(a => a.status === 'pending');
  const active   = agencies.filter(a => a.status === 'active');
  const inactive = agencies.filter(a => a.status === 'inactive');

  const tabs = [
    { key:'pending',  label:'⏳ En attente', count:pending.length,  urgent: pending.length > 0 },
    { key:'active',   label:'✅ Actives',    count:active.length },
    { key:'inactive', label:'❌ Inactives',  count:inactive.length },
    { key:'trips',    label:'🚌 Voyages',    count:trips.length },
  ];

  const displayed = tab === 'pending' ? pending : tab === 'active' ? active : tab === 'inactive' ? inactive : null;

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:'var(--slate-800)', marginBottom:4 }}>⚙️ Panel Administrateur</h1>
        <p style={{ color:'var(--slate-500)', fontSize:14 }}>Gestion des agences et supervision globale</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
        {[
          { label:'Agences actives',    value:active.length,   icon:'✅', color:'#16a34a', bg:'#dcfce7' },
          { label:'En attente',         value:pending.length,  icon:'⏳', color:'#d97706', bg:'#fef3c7', urgent:pending.length > 0 },
          { label:'Total voyages',      value:trips.length,    icon:'🚌', color:'var(--primary)', bg:'var(--primary-50)' },
          { label:'Agences inactives',  value:inactive.length, icon:'❌', color:'#dc2626', bg:'#fee2e2' },
        ].map(({ label, value, icon, color, bg, urgent }) => (
          <div key={label} style={{
            background:'#fff', border:`2px solid ${urgent ? '#f59e0b' : 'var(--slate-200)'}`,
            borderRadius:14, padding:'20px 22px', boxShadow:'var(--shadow)',
            position:'relative', overflow:'hidden',
          }}>
            {urgent && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'#f59e0b' }} />}
            <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
            <div style={{ fontSize:30, fontWeight:900, color, marginBottom:2 }}>{value}</div>
            <div style={{ fontSize:12, color:'var(--slate-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Alerte si agences en attente */}
      {pending.length > 0 && tab !== 'pending' && (
        <div onClick={() => setTab('pending')} style={{
          background:'#fef3c7', border:'2px solid #f59e0b', borderRadius:10,
          padding:'12px 20px', marginBottom:20, cursor:'pointer',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <strong style={{ color:'#92400e' }}>{pending.length} agence{pending.length>1?'s':''} en attente de validation</strong>
            <p style={{ fontSize:13, color:'#b45309', margin:0 }}>Cliquez ici pour les valider</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid var(--slate-200)', marginBottom:24 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none',
            cursor:'pointer', position:'relative',
            color: tab===t.key ? 'var(--primary)' : 'var(--slate-500)',
            borderBottom: tab===t.key ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom:-2,
          }}>
            {t.label}
            <span style={{
              marginLeft:6, background: t.urgent ? '#f59e0b' : tab===t.key ? 'var(--primary)' : 'var(--slate-200)',
              color: t.urgent || tab===t.key ? '#fff' : 'var(--slate-600)',
              fontSize:11, fontWeight:700, borderRadius:10, padding:'1px 7px',
            }}>{t.count}</span>
          </button>
        ))}
        <button onClick={load} style={{ marginLeft:'auto', fontSize:13, color:'var(--primary)', background:'none', border:'none', cursor:'pointer', padding:'10px', fontWeight:600 }}>
          ↺ Actualiser
        </button>
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center' }}>
          <div style={{ width:40, height:40, border:'3px solid var(--slate-200)', borderTopColor:'var(--primary)', borderRadius:'50%', margin:'0 auto' }} className="spinning" />
        </div>
      ) : (
        <>
          {/* Onglets agences */}
          {displayed !== null && (
            <div style={{ background:'#fff', border:'1px solid var(--slate-200)', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)' }}>
              {displayed.length === 0 ? (
                <div style={{ padding:60, textAlign:'center', color:'var(--slate-400)' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>
                    {tab === 'pending' ? '🎉' : '—'}
                  </div>
                  <p style={{ fontSize:15, fontWeight:600 }}>
                    {tab === 'pending' ? 'Aucune agence en attente — tout est à jour !' : 'Aucune agence dans cette catégorie'}
                  </p>
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--slate-50)' }}>
                      {['Agence','Ville','Email','Voyages','Rôles','Statut','Actions'].map(h => (
                        <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--slate-400)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--slate-200)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((a, i) => {
                      const s = STATUS_CFG[a.status] || STATUS_CFG.active;
                      const isLoading = actionLoading === a.id;
                      return (
                        <tr key={a.id} style={{ borderBottom: i < displayed.length-1 ? '1px solid var(--slate-100)' : 'none', background: a.status==='pending' ? '#fffbeb' : '#fff', opacity: isLoading ? .6 : 1, transition:'opacity .2s' }}>
                          {/* Agence */}
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{
                                width:38, height:38, borderRadius:9, flexShrink:0,
                                background:`linear-gradient(135deg,${a.colors?.primary||'#2563eb'},${a.colors?.secondary||'#0ea5e9'})`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                color:'#fff', fontWeight:800, fontSize:16,
                              }}>{a.name[0]}</div>
                              <div>
                                <div style={{ fontWeight:700, fontSize:14, color:'var(--slate-800)' }}>{a.name}</div>
                                {a.rating && <div style={{ fontSize:11, color:'var(--slate-400)' }}>⭐ {a.rating}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'14px 16px', fontSize:13, color:'var(--slate-600)' }}>{a.city || '—'}</td>
                          <td style={{ padding:'14px 16px', fontSize:13, color:'var(--slate-600)' }}>{a.email}</td>
                          <td style={{ padding:'14px 16px', fontSize:13, fontWeight:700, color:'var(--slate-700)' }}>
                            {trips.filter(t => t.agency?.id === a.id).length}
                          </td>
                          <td style={{ padding:'14px 16px' }}>
                            {a.isAdmin && <span style={{ fontSize:11, background:'#fee2e2', color:'#dc2626', padding:'3px 8px', borderRadius:5, fontWeight:700 }}>ADMIN</span>}
                          </td>
                          <td style={{ padding:'14px 16px' }}>
                            <span style={{ fontSize:12, background:s.light, color:s.bg, padding:'5px 10px', borderRadius:8, fontWeight:700 }}>
                              {s.label}
                            </span>
                          </td>
                          {/* Actions */}
                          <td style={{ padding:'14px 16px' }}>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                              {a.status === 'pending' && (
                                <>
                                  <ActionBtn label="✓ Valider" color="#16a34a" bg="#dcfce7" border="#bbf7d0" loading={isLoading}
                                    onClick={() => action(api.adminActivate, a.id)} />
                                  <ActionBtn label="✕ Rejeter" color="#dc2626" bg="#fee2e2" border="#fecaca" loading={isLoading}
                                    onClick={() => action(api.adminDeactivate, a.id)} />
                                </>
                              )}
                              {a.status === 'active' && (
                                <ActionBtn label="Désactiver" color="#dc2626" bg="#fee2e2" border="#fecaca" loading={isLoading}
                                  onClick={() => action(api.adminDeactivate, a.id)} />
                              )}
                              {a.status === 'inactive' && (
                                <ActionBtn label="Réactiver" color="#2563eb" bg="#dbeafe" border="#bfdbfe" loading={isLoading}
                                  onClick={() => action(api.adminActivate, a.id)} />
                              )}
                              {/* Promote / Demote */}
                              {a.status === 'active' && !a.isAdmin && (
                                <ActionBtn label="→ Admin" color="#7c3aed" bg="#ede9fe" border="#c4b5fd" loading={isLoading}
                                  onClick={() => action(api.adminPromote, a.id)} />
                              )}
                              {a.isAdmin && a.email !== user.email && (
                                <ActionBtn label="↓ Retirer admin" color="#64748b" bg="#f1f5f9" border="#e2e8f0" loading={isLoading}
                                  onClick={() => action(api.adminDemote, a.id)} />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Onglet voyages */}
          {tab === 'trips' && (
            <div style={{ background:'#fff', border:'1px solid var(--slate-200)', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--slate-50)' }}>
                    {['Trajet','Agence','Départ','Type','Places','Prix','Statut'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--slate-400)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--slate-200)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t, i) => {
                    const SC = { on_time:'#16a34a',boarding:'#2563eb',delayed:'#d97706',departed:'#64748b',cancelled:'#dc2626' };
                    const SL = { on_time:"À l'heure",boarding:'Embarquement',delayed:'Retard',departed:'Parti',cancelled:'Annulé' };
                    const sc = SC[t.status]||'#64748b';
                    return (
                      <tr key={t.id} style={{ borderBottom:i<trips.length-1?'1px solid var(--slate-100)':'none' }}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ fontWeight:700, fontSize:14, color:'var(--slate-800)' }}>{t.fromCity} → {t.toCity}</div>
                          <div style={{ fontSize:11, color:'var(--slate-400)' }}>{t.date}</div>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'var(--slate-600)' }}>{t.agency?.name}</td>
                        <td style={{ padding:'12px 16px', fontFamily:'monospace', fontWeight:600, color:'var(--slate-700)' }}>{t.departureTime}</td>
                        <td style={{ padding:'12px 16px' }}><span style={{ fontSize:12, background:'var(--slate-100)', padding:'3px 8px', borderRadius:6, color:'var(--slate-600)', fontWeight:600 }}>{t.type}</span></td>
                        <td style={{ padding:'12px 16px', fontWeight:700, color:t.availableSeats<=10?'#dc2626':'#16a34a' }}>{t.availableSeats}/{t.totalSeats}</td>
                        <td style={{ padding:'12px 16px', fontWeight:700, color:'var(--primary)' }}>{t.price}€</td>
                        <td style={{ padding:'12px 16px' }}><span style={{ fontSize:12, background:sc+'18', color:sc, padding:'4px 10px', borderRadius:8, fontWeight:700 }}>{SL[t.status]||t.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ActionBtn({ label, color, bg, border, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding:'6px 12px', borderRadius:7, border:`1px solid ${border}`,
      background:bg, color, fontSize:12, fontWeight:700, cursor:loading?'wait':'pointer',
      opacity:loading?.6:1, transition:'opacity .15s',
    }}>
      {loading ? '…' : label}
    </button>
  );
}

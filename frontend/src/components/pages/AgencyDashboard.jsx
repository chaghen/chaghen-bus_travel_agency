import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../App.jsx';
import { api } from '../../services/api.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';

const TYPES = ['standard','premium','luxury','couchette'];
const STATUSES = [
  { v:'on_time',   l:'À l\'heure', color:'#16a34a' },
  { v:'boarding',  l:'Embarquement', color:'#2563eb' },
  { v:'delayed',   l:'Retard', color:'#d97706' },
  { v:'departed',  l:'Parti', color:'#64748b' },
  { v:'cancelled', l:'Annulé', color:'#dc2626' },
];

export default function AgencyDashboard() {
  const { user } = useApp();
  const [trips, setTrips]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editTrip, setEditTrip]   = useState(null);
  const [statusModal, setStatus]  = useState(null);

  const load = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const all = await api.searchTrips({});
      setTrips(all.filter(t => t.agency?.id === user.agencyId));
    } catch { } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // WS: update own trips in real time
  useWebSocket({
    onTripUpdated: d => d.agency?.id === user?.agencyId && setTrips(p => p.map(t => t.id===d.id ? {...t,...d} : t)),
    onTripCreated: d => d.agency?.id === user?.agencyId && setTrips(p => [d,...p]),
    onTripDeleted: d => setTrips(p => p.filter(t => t.id !== d.id)),
    onTripStatus:  d => d.agency?.id === user?.agencyId && setTrips(p => p.map(t => t.id===d.id ? {...t,...d} : t)),
  });

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce voyage ?')) return;
    try { await api.deleteTrip(id, user.token); setTrips(p => p.filter(t => t.id !== id)); }
    catch (e) { alert(e.message); }
  };

  const totalSeats = trips.reduce((s,t) => s + (t.totalSeats || 0), 0);
  const totalAvail = trips.reduce((s,t) => s + (t.availableSeats || 0), 0);
  const revenue    = trips.reduce((s,t) => s + ((t.totalSeats - t.availableSeats) * t.price), 0);

  if (!user) return <div style={{ padding:60, textAlign:'center' }}>Connectez-vous pour accéder au dashboard.</div>;

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'var(--slate-800)', marginBottom:4 }}>Dashboard Agence</h1>
          <p style={{ color:'var(--slate-500)', fontSize:14 }}>Gérez vos voyages en temps réel</p>
        </div>
        <button onClick={() => { setEditTrip(null); setShowForm(true); }} style={{
          padding:'10px 22px', borderRadius:10, background:'var(--primary)', color:'#fff', fontWeight:700, fontSize:14,
        }}>
          + Nouveau voyage
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:32 }}>
        {[
          { label:'Voyages actifs', value: trips.filter(t=>t.status!=='cancelled').length, icon:'🚌', color:'var(--primary)' },
          { label:'Total voyages',  value: trips.length, icon:'📋', color:'var(--slate-600)' },
          { label:'Places restantes', value: totalAvail + '/' + totalSeats, icon:'💺', color:totalAvail < 20 ? '#dc2626' : '#16a34a' },
          { label:'Chiffre estimé', value: revenue.toFixed(0)+'€', icon:'💰', color:'var(--amber)' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background:'#fff', border:'1px solid var(--slate-200)', borderRadius:12, padding:'20px 24px', boxShadow:'var(--shadow)' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color, marginBottom:2 }}>{value}</div>
            <div style={{ fontSize:12, color:'var(--slate-400)', fontWeight:500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Trips table */}
      <div style={{ background:'#fff', border:'1px solid var(--slate-200)', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)' }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--slate-100)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontWeight:700, fontSize:16, color:'var(--slate-800)' }}>Mes voyages</h2>
          <button onClick={load} style={{ fontSize:13, color:'var(--primary)', background:'none', border:'none', fontWeight:600 }}>↺ Actualiser</button>
        </div>

        {loading ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ width:36, height:36, border:'3px solid var(--slate-200)', borderTopColor:'var(--primary)', borderRadius:'50%', margin:'0 auto' }} className="spinning" />
          </div>
        ) : trips.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🚌</div>
            <h3 style={{ fontWeight:700, color:'var(--slate-700)', marginBottom:8 }}>Aucun voyage</h3>
            <p style={{ color:'var(--slate-400)', fontSize:14 }}>Cliquez sur "+ Nouveau voyage" pour commencer</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--slate-50)' }}>
                  {['Trajet','Départ','Places','Prix','Type','Statut','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--slate-400)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--slate-200)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map((t, i) => {
                  const s = STATUSES.find(st => st.v === t.status) || STATUSES[0];
                  return (
                    <tr key={t.id} style={{ borderBottom: i < trips.length-1 ? '1px solid var(--slate-100)' : 'none' }}>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ fontWeight:700, fontSize:14, color:'var(--slate-800)' }}>{t.fromCity} → {t.toCity}</div>
                        <div style={{ fontSize:12, color:'var(--slate-400)' }}>{t.date} · {t.platform}</div>
                      </td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontWeight:600, color:'var(--slate-700)' }}>{t.departureTime}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ fontWeight:700, color: t.availableSeats <= 10 ? '#dc2626' : '#16a34a' }}>{t.availableSeats}</span>
                        <span style={{ color:'var(--slate-400)', fontSize:13 }}>/{t.totalSeats}</span>
                      </td>
                      <td style={{ padding:'14px 16px', fontWeight:700, color:'var(--primary)' }}>{t.price}€</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ fontSize:12, background:'var(--slate-100)', padding:'3px 8px', borderRadius:6, color:'var(--slate-600)', fontWeight:600 }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ fontSize:12, background:s.color+'18', color:s.color, padding:'4px 10px', borderRadius:8, fontWeight:700 }}>
                          {s.l}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => { setEditTrip(t); setShowForm(true); }} style={actionBtn('#2563eb')}>✏️</button>
                          <button onClick={() => setStatus(t)} style={actionBtn('#d97706')}>📡</button>
                          <button onClick={() => handleDelete(t.id)} style={actionBtn('#dc2626')}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <TripFormModal
          trip={editTrip}
          token={user.token}
          onClose={() => { setShowForm(false); setEditTrip(null); }}
          onSave={(t) => {
            if (editTrip) setTrips(p => p.map(x => x.id===t.id ? t : x));
            else setTrips(p => [t, ...p]);
            setShowForm(false); setEditTrip(null);
          }}
        />
      )}

      {statusModal && (
        <StatusModal
          trip={statusModal}
          token={user.token}
          onClose={() => setStatus(null)}
          onSave={(t) => { setTrips(p => p.map(x => x.id===t.id ? t : x)); setStatus(null); }}
        />
      )}
    </div>
  );
}

function TripFormModal({ trip, token, onClose, onSave }) {
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({
    fromCity: trip?.fromCity || '', toCity: trip?.toCity || '',
    date: trip?.date || today,
    departureTime: trip?.departureTime || '09:00',
    arrivalTime:   trip?.arrivalTime   || '13:00',
    duration: trip?.duration || '4h00',
    price: trip?.price || '', vipPrice: trip?.vipPrice || '',
    type: trip?.type || 'standard',
    platform: trip?.platform || '',
    totalSeats: trip?.totalSeats || 50,
    availableSeats: trip?.availableSeats || 50,
    baggageAllowance: trip?.baggageAllowance || 20,
    extraBaggagePrice: trip?.extraBaggagePrice || 6,
    description: trip?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const handleSave = async () => {
    if (!form.fromCity || !form.toCity || !form.price) return setError('Champs obligatoires manquants');
    setLoading(true); setError('');
    try {
      const res = trip
        ? await api.updateTrip(trip.id, form, token)
        : await api.createTrip(form, token);
      onSave(res);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:900, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} className="slide-up" style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:600, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>
        <div style={{ background:'linear-gradient(135deg, #1e3a8a, #1d4ed8)', padding:'20px 28px', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0 }}>
          <h2 style={{ fontWeight:800, fontSize:18 }}>{trip ? 'Modifier le voyage' : 'Nouveau voyage'}</h2>
          <button onClick={onClose} style={{ color:'rgba(255,255,255,.7)', fontSize:22, background:'none' }}>×</button>
        </div>
        <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Field label="Ville de départ *" value={form.fromCity} onChange={v => set('fromCity',v)} />
            <Field label="Ville d'arrivée *" value={form.toCity} onChange={v => set('toCity',v)} />
            <Field label="Date" type="date" value={form.date} onChange={v => set('date',v)} />
            <Field label="Durée" value={form.duration} onChange={v => set('duration',v)} placeholder="ex: 4h30" />
            <Field label="Départ" type="time" value={form.departureTime} onChange={v => set('departureTime',v)} />
            <Field label="Arrivée" type="time" value={form.arrivalTime} onChange={v => set('arrivalTime',v)} />
            <Field label="Prix standard (€) *" type="number" value={form.price} onChange={v => set('price',v)} />
            <Field label="Prix VIP (€)" type="number" value={form.vipPrice} onChange={v => set('vipPrice',v)} placeholder="Laisser vide si non" />
            <Field label="Quai / Plateforme" value={form.platform} onChange={v => set('platform',v)} placeholder="ex: Quai 3" />
            <div>
              <label style={fLabel}>Type de bus</label>
              <select value={form.type} onChange={e=>set('type',e.target.value)} style={fInput}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Nb places total" type="number" value={form.totalSeats} onChange={v => set('totalSeats',v)} />
            <Field label="Places disponibles" type="number" value={form.availableSeats} onChange={v => set('availableSeats',v)} />
            <Field label="Franchise bagage (kg)" type="number" value={form.baggageAllowance} onChange={v => set('baggageAllowance',v)} />
            <Field label="Supplément bagage (€)" type="number" value={form.extraBaggagePrice} onChange={v => set('extraBaggagePrice',v)} />
          </div>
          <div>
            <label style={fLabel}>Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2}
              style={{ ...fInput, resize:'vertical' }} placeholder="Description du voyage…" />
          </div>
          {error && <p style={{ color:'var(--red)', fontSize:13 }}>{error}</p>}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--slate-200)', color:'var(--slate-700)', fontWeight:600, fontSize:14 }}>Annuler</button>
            <button onClick={handleSave} disabled={loading} style={{ flex:2, padding:'11px', borderRadius:10, background:'var(--primary)', color:'#fff', fontWeight:700, fontSize:14 }}>
              {loading ? 'Sauvegarde…' : trip ? 'Mettre à jour' : 'Créer le voyage'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusModal({ trip, token, onClose, onSave }) {
  const [status, setStatus] = useState(trip.status);
  const [delay, setDelay]   = useState(trip.delayMinutes || 0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.updateStatus(trip.id, { status, delayMinutes: delay }, token);
      onSave(res);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:900, padding:16 }}>
      <div onClick={e=>e.stopPropagation()} className="slide-up" style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:400, boxShadow:'0 24px 64px rgba(0,0,0,.2)', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg, #1e3a8a, #1d4ed8)', padding:'16px 24px', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontWeight:700, fontSize:16 }}>Mettre à jour le statut</h2>
          <button onClick={onClose} style={{ color:'rgba(255,255,255,.7)', fontSize:20, background:'none' }}>×</button>
        </div>
        <div style={{ padding:'24px' }}>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--slate-700)', marginBottom:16 }}>
            {trip.fromCity} → {trip.toCity} · {trip.departureTime}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            {STATUSES.map(s => (
              <label key={s.v} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:`2px solid ${status===s.v ? s.color : 'var(--slate-200)'}`, cursor:'pointer', background: status===s.v ? s.color+'12' : '#fff' }}>
                <input type="radio" name="status" value={s.v} checked={status===s.v} onChange={() => setStatus(s.v)} />
                <span style={{ fontWeight:600, fontSize:14, color:s.color }}>{s.l}</span>
              </label>
            ))}
          </div>
          {status === 'delayed' && (
            <div style={{ marginBottom:20 }}>
              <label style={fLabel}>Retard (minutes)</label>
              <input type="number" value={delay} onChange={e=>setDelay(+e.target.value)} min="0" max="180" style={fInput} />
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid var(--slate-200)', color:'var(--slate-700)', fontWeight:600 }}>Annuler</button>
            <button onClick={handleSave} disabled={loading} style={{ flex:2, padding:'10px', borderRadius:10, background:'var(--primary)', color:'#fff', fontWeight:700 }}>
              {loading ? 'Mise à jour…' : 'Confirmer → En direct'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type='text', value, onChange, placeholder }) {
  return (
    <div>
      <label style={fLabel}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={fInput} />
    </div>
  );
}

const actionBtn = (color) => ({ padding:'6px 10px', borderRadius:8, border:`1px solid ${color}22`, background:`${color}12`, color, fontSize:14, cursor:'pointer' });
const fLabel = { fontSize:12, fontWeight:600, color:'var(--slate-500)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.4px' };
const fInput = { width:'100%', padding:'9px 12px', borderRadius:8, fontSize:13, border:'1.5px solid var(--slate-200)', background:'var(--slate-50)' };

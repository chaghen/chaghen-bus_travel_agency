import { useState } from 'react';
import { useApp } from '../App.jsx';
import { api } from '../services/api.js';

export default function BookingModal() {
  const { bookingTrip: trip, setBookingTrip, user } = useApp();
  const [step, setStep]         = useState(1);
  const [nbPass, setNbPass]     = useState(1);
  const [passengers, setPass]   = useState([prefillPassenger(user)]);
  const [seatClass, setSeat]    = useState('standard');
  const [extraBags, setExtra]   = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [booking, setBooking]   = useState(null);

  if (!trip) return null;

  const basePrice   = seatClass === 'vip' && trip.vipPrice ? trip.vipPrice : trip.price;
  const baggageCost = extraBags * (trip.extraBaggagePrice || 6);
  const total       = basePrice * nbPass + baggageCost;

  const updatePassCount = (n) => {
    setNbPass(n);
    setPass(prev => Array.from({ length: n }, (_, i) =>
      prev[i] || (i === 0 ? prefillPassenger(user) : emptyPass())
    ));
  };

  const updatePass = (i, field, val) =>
    setPass(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const validateStep1 = () => {
    const missing = passengers.find(p => !p.firstName.trim() || !p.lastName.trim() || !p.email.trim());
    if (missing) { setError('Tous les champs sont requis pour chaque passager'); return false; }
    if (passengers.some(p => !/\S+@\S+\.\S+/.test(p.email))) { setError('Email invalide'); return false; }
    return true;
  };

  const handleConfirm = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.createBooking({ tripId: trip.id, passengers, seatClass, extraBags }, user?.token);
      setBooking(res);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Erreur lors de la réservation');
    } finally { setLoading(false); }
  };

  const close = () => setBookingTrip(null);

  return (
    <div onClick={close} style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,.65)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background:'#fff', borderRadius:20, width:'100%', maxWidth:580,
        maxHeight:'92vh', display:'flex', flexDirection:'column',
        boxShadow:'0 24px 64px rgba(0,0,0,.25)', overflow:'hidden',
      }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)', padding:'18px 28px', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <h2 style={{ fontWeight:800, fontSize:19, marginBottom:2 }}>
              {step === 4 ? '✅ Réservation confirmée' : `${trip.fromCity} → ${trip.toCity}`}
            </h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.75)' }}>
              {trip.agency?.name} · {trip.departureTime} → {trip.arrivalTime} · {trip.duration}
            </p>
          </div>
          <button onClick={close} style={{ color:'rgba(255,255,255,.7)', fontSize:24, background:'none', padding:'2px 8px', cursor:'pointer' }}>×</button>
        </div>

        {/* Stepper */}
        {step < 4 && (
          <div style={{ display:'flex', padding:'14px 28px', borderBottom:'1px solid var(--slate-100)', flexShrink:0, background:'var(--slate-50)' }}>
            {['Passagers','Classe & Bagages','Paiement'].map((label, i) => (
              <div key={i} style={{ flex:1, textAlign:'center' }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', margin:'0 auto 4px',
                  background: step > i+1 ? '#16a34a' : step===i+1 ? 'var(--primary)' : 'var(--slate-200)',
                  color:'#fff', fontSize:12, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {step > i+1 ? '✓' : i+1}
                </div>
                <div style={{ fontSize:11, color: step===i+1 ? 'var(--primary)' : 'var(--slate-400)', fontWeight: step===i+1 ? 600 : 400 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contenu scrollable */}
        <div style={{ padding:'22px 28px', overflowY:'auto', flex:1 }}>

          {/* ── ÉTAPE 1 — Passagers ── */}
          {step === 1 && (
            <>
              {user?.role === 'user' && (
                <div style={{ background:'var(--primary-50)', border:'1px solid var(--primary-100)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--primary)', marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
                  ✅ Infos du passager 1 pré-remplies — vous pouvez les modifier si vous réservez pour quelqu'un d'autre
                </div>
              )}

              <div style={{ marginBottom:18 }}>
                <label style={lbl}>Nombre de passagers</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[1,2,3,4,5,6].map(n => (
                    <button key={n} onClick={() => updatePassCount(n)} style={{
                      width:38, height:38, borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer',
                      background: nbPass===n ? 'var(--primary)' : 'var(--slate-100)',
                      color:      nbPass===n ? '#fff' : 'var(--slate-700)',
                      border:     nbPass===n ? 'none' : '1px solid var(--slate-200)',
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {passengers.map((p, i) => (
                  <div key={i} style={{ background:'var(--slate-50)', borderRadius:12, padding:'16px', border:'1px solid var(--slate-200)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'var(--slate-700)', margin:0 }}>
                        Passager {i+1} {i===0 && user?.role==='user' ? <span style={{ color:'var(--primary)', fontWeight:500, fontSize:11 }}>(vous — modifiable)</span> : ''}
                      </p>
                      {i > 0 && (
                        <button onClick={() => {
                          updatePass(i, 'firstName', user?.firstName || '');
                          updatePass(i, 'lastName',  user?.lastName  || '');
                          updatePass(i, 'email',     user?.email     || '');
                        }} style={{ fontSize:11, color:'var(--primary)', background:'none', border:'1px solid var(--primary-100)', borderRadius:5, padding:'3px 8px', cursor:'pointer' }}>
                          Copier mes infos
                        </button>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                      <input placeholder="Prénom *" value={p.firstName} onChange={e => updatePass(i,'firstName',e.target.value)}
                        style={inp(p.firstName)} />
                      <input placeholder="Nom *" value={p.lastName} onChange={e => updatePass(i,'lastName',e.target.value)}
                        style={inp(p.lastName)} />
                    </div>
                    <input placeholder="Email *" type="email" value={p.email} onChange={e => updatePass(i,'email',e.target.value)}
                      style={{ ...inp(p.email), width:'100%' }} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ÉTAPE 2 — Classe & Bagages ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom:22 }}>
                <label style={lbl}>Classe de voyage</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { key:'standard', label:'Standard', price:trip.price, icon:'🚌', desc:'Siège confortable' },
                    ...(trip.vipPrice ? [{ key:'vip', label:'VIP ⭐', price:trip.vipPrice, icon:'✨', desc:'Siège premium + services' }] : []),
                  ].map(c => (
                    <button key={c.key} onClick={() => setSeat(c.key)} style={{
                      padding:'16px', borderRadius:12, textAlign:'left', cursor:'pointer',
                      border:`2px solid ${seatClass===c.key ? 'var(--primary)' : 'var(--slate-200)'}`,
                      background: seatClass===c.key ? 'var(--primary-50)' : '#fff',
                    }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{c.icon}</div>
                      <div style={{ fontWeight:700, color:'var(--slate-800)', fontSize:14 }}>{c.label}</div>
                      <div style={{ fontSize:11, color:'var(--slate-400)', marginBottom:8 }}>{c.desc}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:'var(--primary)' }}>{c.price}€<span style={{ fontSize:12, color:'var(--slate-400)', fontWeight:400 }}>/pers.</span></div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={lbl}>Bagages supplémentaires (+{trip.extraBaggagePrice||6}€/bagage)</label>
                <p style={{ fontSize:12, color:'var(--slate-400)', marginBottom:10 }}>{trip.baggageAllowance}kg inclus gratuit par personne</p>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <button onClick={() => setExtra(Math.max(0,extraBags-1))} style={cntBtn}>−</button>
                  <span style={{ fontWeight:700, fontSize:20, minWidth:24, textAlign:'center' }}>{extraBags}</span>
                  <button onClick={() => setExtra(Math.min(5,extraBags+1))} style={cntBtn}>+</button>
                  {extraBags > 0 && <span style={{ fontSize:13, color:'var(--slate-500)' }}>= {baggageCost}€ total</span>}
                </div>
              </div>

              {/* Récap */}
              <div style={{ background:'var(--slate-50)', borderRadius:12, padding:'16px' }}>
                <div style={{ fontSize:13, color:'var(--slate-500)', marginBottom:6, fontWeight:600 }}>Récapitulatif</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--slate-600)', marginBottom:4 }}>
                  <span>{nbPass} passager{nbPass>1?'s':''} × {basePrice}€ ({seatClass==='vip'?'VIP':'Standard'})</span>
                  <span>{(basePrice*nbPass).toFixed(2)}€</span>
                </div>
                {extraBags > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--slate-600)', marginBottom:4 }}>
                    <span>{extraBags} bagage{extraBags>1?'s':''} suppl.</span>
                    <span>{baggageCost.toFixed(2)}€</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:18, color:'var(--primary)', borderTop:'1px solid var(--slate-200)', paddingTop:10, marginTop:8 }}>
                  <span>Total</span><span>{total.toFixed(2)}€</span>
                </div>
              </div>
            </>
          )}

          {/* ── ÉTAPE 3 — Paiement ── */}
          {step === 3 && (
            <>
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'11px 16px', marginBottom:18, fontSize:13, color:'#16a34a', fontWeight:600 }}>
                🔒 Paiement sécurisé (simulation — aucune vraie transaction)
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:18 }}>
                <div>
                  <label style={lbl}>Numéro de carte</label>
                  <input style={{ ...inp('1'), width:'100%' }} defaultValue="4242 4242 4242 4242" placeholder="4242 4242 4242 4242" />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div><label style={lbl}>Expiration</label><input style={inp('1')} defaultValue="12/28" placeholder="MM/AA" /></div>
                  <div><label style={lbl}>CVV</label><input style={inp('1')} defaultValue="123" placeholder="123" /></div>
                </div>
              </div>
              <div style={{ background:'var(--slate-50)', borderRadius:12, padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:19, color:'var(--primary)' }}>
                  <span>Total à payer</span><span>{total.toFixed(2)}€</span>
                </div>
              </div>
            </>
          )}

          {/* ── ÉTAPE 4 — Succès + PDF ── */}
          {step === 4 && booking && (
            <SuccessScreen booking={booking} trip={trip} seatClass={seatClass} nbPass={nbPass} passengers={passengers} total={total} onClose={close} />
          )}

          {error && step < 4 && (
            <p style={{ color:'var(--red)', fontSize:13, textAlign:'center', marginTop:12, fontWeight:500 }}>{error}</p>
          )}
        </div>

        {/* Footer boutons — fixe */}
        {step < 4 && (
          <div style={{ padding:'14px 28px', borderTop:'1px solid var(--slate-100)', flexShrink:0, background:'#fff', display:'flex', gap:10 }}>
            {step > 1 && (
              <button onClick={() => { setStep(s=>s-1); setError(''); }} style={btnSec}>← Retour</button>
            )}
            {step === 1 && (
              <button onClick={() => { if(validateStep1()) { setError(''); setStep(2); } }} style={{ ...btnPri, flex:1 }}>
                Continuer →
              </button>
            )}
            {step === 2 && (
              <button onClick={() => setStep(3)} style={{ ...btnPri, flex:1 }}>Continuer →</button>
            )}
            {step === 3 && (
              <button onClick={handleConfirm} disabled={loading} style={{ ...btnPri, flex:1, opacity:loading?.7:1 }}>
                {loading ? '⏳ Traitement…' : `✓ Confirmer ${total.toFixed(2)}€`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Écran de succès avec téléchargement PDF ─────────────────────────────── */
function SuccessScreen({ booking, trip, seatClass, nbPass, passengers, total, onClose }) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      // Génération du billet HTML → impression PDF
      const html = generateTicketHTML({ booking, trip, seatClass, nbPass, passengers, total });
      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); setPdfLoading(false); }, 500);
    } catch { setPdfLoading(false); }
  };

  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
      <h3 style={{ fontSize:21, fontWeight:800, color:'var(--slate-800)', marginBottom:8 }}>Réservation confirmée !</h3>
      <p style={{ fontSize:14, color:'var(--slate-500)', marginBottom:20 }}>
        Conservez votre référence — elle vous permettra de retrouver votre réservation.
      </p>

      {/* Référence */}
      <div style={{ background:'linear-gradient(135deg,var(--primary-50),#e0f2fe)', border:'1px solid var(--primary-100)', borderRadius:14, padding:'16px 24px', marginBottom:20, display:'inline-block', minWidth:240 }}>
        <p style={{ fontSize:11, color:'var(--slate-500)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.8px' }}>Référence de réservation</p>
        <p style={{ fontSize:28, fontWeight:900, color:'var(--primary)', letterSpacing:3, fontFamily:'monospace' }}>{booking.reference}</p>
      </div>

      {/* Détails */}
      <div style={{ background:'var(--slate-50)', borderRadius:12, padding:16, textAlign:'left', marginBottom:20 }}>
        {[
          ['🛣️ Trajet',     `${booking.trip?.from} → ${booking.trip?.to}`],
          ['📅 Date',       booking.trip?.date],
          ['🕐 Départ',     booking.trip?.departureTime],
          ['🏢 Agence',     booking.trip?.agency],
          ['👥 Passagers',  `${nbPass} passager${nbPass>1?'s':''}`],
          ['💺 Classe',     seatClass === 'vip' ? '⭐ VIP' : 'Standard'],
          ['💶 Total payé', `${Number(booking.totalAmount).toFixed(2)}€`],
        ].map(([label, val]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--slate-200)' }}>
            <span style={{ color:'var(--slate-500)' }}>{label}</span>
            <span style={{ fontWeight:600, color:'var(--slate-800)' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Passagers */}
      <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 16px', textAlign:'left', marginBottom:20 }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#166534', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>Passagers</p>
        {passengers.map((p, i) => (
          <div key={i} style={{ fontSize:13, color:'#166534', padding:'2px 0' }}>
            {i+1}. {p.firstName} {p.lastName} — {p.email}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={downloadPDF} disabled={pdfLoading} style={{
          flex:1, padding:'12px', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer',
          background: pdfLoading ? 'var(--slate-200)' : '#16a34a', color:'#fff', border:'none',
        }}>
          {pdfLoading ? '⏳ Génération…' : '📄 Télécharger le billet PDF'}
        </button>
        <button onClick={onClose} style={{
          flex:1, padding:'12px', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer',
          background:'var(--primary)', color:'#fff', border:'none',
        }}>Fermer</button>
      </div>
    </div>
  );
}

/* ── Génération du billet HTML (imprimable comme PDF) ──────────────────── */
function generateTicketHTML({ booking, trip, seatClass, nbPass, passengers, total }) {
  const date = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Billet BusExpress — ${booking.reference}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; color: #1e293b; padding: 32px; max-width: 700px; margin: 0 auto; }
  @media print { body { padding: 16px; } .no-print { display: none; } }

  .header { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); color: #fff; padding: 24px 28px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
  .logo span { color: #fbbf24; }
  .ref-box { background: rgba(255,255,255,.15); border-radius: 8px; padding: 10px 16px; text-align: center; }
  .ref-label { font-size: 10px; opacity: .8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .ref-code { font-size: 22px; font-weight: 900; font-family: monospace; letter-spacing: 3px; }

  .section { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px; overflow: hidden; }
  .section-title { background: #f8fafc; padding: 10px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #e2e8f0; }
  .section-body { padding: 16px; }

  .route { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
  .city { font-size: 24px; font-weight: 800; color: #1e3a8a; }
  .arrow { font-size: 20px; color: #94a3b8; }
  .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .meta-item { background: #f1f5f9; border-radius: 8px; padding: 10px; text-align: center; }
  .meta-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  .meta-value { font-size: 15px; font-weight: 700; color: #1e293b; }

  .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .row-label { color: #64748b; }
  .row-value { font-weight: 600; }

  .passenger { background: #f8fafc; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; display: flex; gap: 12px; align-items: center; font-size: 13px; }
  .pnum { width: 24px; height: 24px; background: #2563eb; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }

  .total-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px solid #2563eb; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .total-label { font-size: 14px; font-weight: 700; color: #1e3a8a; }
  .total-amount { font-size: 28px; font-weight: 900; color: #1d4ed8; }

  .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  .qr-placeholder { width: 80px; height: 80px; border: 2px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; text-align: center; margin: 0 auto 8px; }

  .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
  .badge-standard { background: #f1f5f9; color: #475569; }
  .badge-vip { background: #ede9fe; color: #7c3aed; }

  .print-btn { display: block; margin: 20px auto 0; padding: 12px 32px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">🚌 Bus<span>Express</span></div>
    <div style="font-size:12px;opacity:.8;margin-top:4px;">Billet électronique — ${date}</div>
  </div>
  <div class="ref-box">
    <div class="ref-label">Référence</div>
    <div class="ref-code">${booking.reference}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">🛣️ Trajet</div>
  <div class="section-body">
    <div class="route">
      <div class="city">${booking.trip?.from || trip.fromCity}</div>
      <div class="arrow">→</div>
      <div class="city">${booking.trip?.to || trip.toCity}</div>
    </div>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Date</div>
        <div class="meta-value">${booking.trip?.date || trip.date}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Départ</div>
        <div class="meta-value">${booking.trip?.departureTime || trip.departureTime}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Durée</div>
        <div class="meta-value">${trip.duration}</div>
      </div>
    </div>
    <div style="margin-top:12px;">
      <div class="row"><span class="row-label">Agence</span><span class="row-value">${booking.trip?.agency || trip.agency?.name}</span></div>
      <div class="row"><span class="row-label">Quai</span><span class="row-value">${trip.platform || '—'}</span></div>
      <div class="row"><span class="row-label">Classe</span><span class="row-value"><span class="badge badge-${seatClass}">${seatClass === 'vip' ? '⭐ VIP' : 'Standard'}</span></span></div>
      <div class="row"><span class="row-label">Franchise bagage</span><span class="row-value">${trip.baggageAllowance}kg inclus</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">👥 Passagers (${nbPass})</div>
  <div class="section-body">
    ${passengers.map((p,i) => `
    <div class="passenger">
      <div class="pnum">${i+1}</div>
      <div>
        <div style="font-weight:700;color:#1e293b;">${p.firstName} ${p.lastName}</div>
        <div style="color:#64748b;font-size:12px;">${p.email}</div>
      </div>
    </div>`).join('')}
  </div>
</div>

<div class="total-box">
  <div class="total-label">💶 Montant total payé</div>
  <div class="total-amount">${Number(booking.totalAmount || total).toFixed(2)}€</div>
</div>

<div class="section">
  <div class="section-title">ℹ️ Informations importantes</div>
  <div class="section-body">
    <div class="row"><span class="row-label">Présentation</span><span class="row-value">Ce billet + pièce d'identité</span></div>
    <div class="row"><span class="row-label">Présence au quai</span><span class="row-value">15 minutes avant le départ</span></div>
    <div class="row"><span class="row-label">Annulation</span><span class="row-value">Référence : ${booking.reference}</span></div>
  </div>
</div>

<div class="footer">
  <div class="qr-placeholder">QR<br/>${booking.reference}</div>
  <p>Billet généré le ${date} · BusExpress — Plateforme de réservation de bus</p>
  <p style="margin-top:4px;">Conservez ce billet. En cas de problème : contact@busexpress.fr</p>
</div>

<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>

</body>
</html>`;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const prefillPassenger = (user) => ({
  firstName: user?.role === 'user' ? (user.firstName || '') : '',
  lastName:  user?.role === 'user' ? (user.lastName  || '') : '',
  email:     user?.role === 'user' ? (user.email     || '') : '',
});
const emptyPass = () => ({ firstName:'', lastName:'', email:'' });

const lbl    = { fontSize:12, fontWeight:600, color:'var(--slate-600)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.3px' };
const inp    = (val) => ({ padding:'10px 12px', borderRadius:8, fontSize:14, border:`1.5px solid ${val ? 'var(--slate-200)' : '#fca5a5'}`, background: val ? 'var(--slate-50)' : '#fff', width:'100%', boxSizing:'border-box' });
const btnPri = { padding:'12px', borderRadius:10, background:'var(--primary)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none' };
const btnSec = { padding:'12px 18px', borderRadius:10, border:'1px solid var(--slate-200)', background:'#fff', color:'var(--slate-700)', fontWeight:600, fontSize:14, cursor:'pointer' };
const cntBtn = { width:36, height:36, borderRadius:8, background:'var(--slate-100)', color:'var(--slate-700)', fontWeight:700, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none' };

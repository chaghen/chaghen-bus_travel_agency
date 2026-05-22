import { useApp } from '../App.jsx';

const STATUS = {
  on_time:   { label: '✓ À l\'heure',    bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
  boarding:  { label: '→ Embarquement', bg: '#dbeafe', color: '#2563eb', dot: '#2563eb' },
  delayed:   { label: '⚠ Retard',       bg: '#fef3c7', color: '#d97706', dot: '#d97706' },
  departed:  { label: '→ Parti',        bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' },
  cancelled: { label: '✕ Annulé',       bg: '#fee2e2', color: '#dc2626', dot: '#dc2626' },
};

const TYPE = {
  standard:  { label: 'Standard',    bg: '#f1f5f9', color: '#475569' },
  premium:   { label: 'Premium',     bg: '#ede9fe', color: '#7c3aed' },
  luxury:    { label: 'Luxe',        bg: '#fef3c7', color: '#92400e' },
  couchette: { label: 'Couchettes',  bg: '#d1fae5', color: '#065f46' },
};

const AMENITY_ICONS = { wifi:'📶', ac:'❄️', usb:'🔌', coffee:'☕', snacks:'🍫', tv:'📺', blanket:'🛏' };

export default function TripCard({ trip, compact = false }) {
  const { setBookingTrip, compareList, toggleCompare } = useApp();
  const s = STATUS[trip.status] || STATUS.on_time;
  const t = TYPE[trip.type]     || TYPE.standard;
  const inCompare = compareList.some(c => c.id === trip.id);

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${trip.status === 'cancelled' ? '#fecaca' : 'var(--slate-200)'}`,
      borderRadius: 14, padding: compact ? '16px 20px' : '20px 24px',
      boxShadow: 'var(--shadow)', transition: 'box-shadow .2s, transform .2s',
      opacity: trip.status === 'cancelled' ? .7 : 1,
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:8,
            background: `linear-gradient(135deg, ${trip.agency?.colors?.primary || '#2563eb'}, ${trip.agency?.colors?.secondary || '#0ea5e9'})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:800, fontSize:14,
          }}>
            {(trip.agency?.name || 'A')[0]}
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:13, color:'var(--slate-700)' }}>{trip.agency?.name}</div>
            {trip.agency?.rating && <div style={{ fontSize:11, color:'var(--slate-400)' }}>⭐ {trip.agency.rating}</div>}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Status */}
          <span style={{ background:s.bg, color:s.color, fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:20 }}>
            {s.label}
          </span>
          {/* Type */}
          <span style={{ background:t.bg, color:t.color, fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:20 }}>
            {t.label}
          </span>
        </div>
      </div>

      {/* Route timeline */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:16 }}>
        <div style={{ textAlign:'center', minWidth:80 }}>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--slate-800)', letterSpacing:'-1px' }}>{trip.departureTime}</div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--slate-700)' }}>{trip.fromCity}</div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'0 12px' }}>
          <div style={{ fontSize:11, color:'var(--slate-400)', fontWeight:500 }}>{trip.duration}</div>
          <div style={{ width:'100%', height:2, background:'var(--slate-200)', position:'relative' }}>
            <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', fontSize:14 }}>🚌</div>
          </div>
          {trip.stops?.length > 0 && (
            <div style={{ fontSize:10, color:'var(--slate-400)' }}>{trip.stops.length} arrêt{trip.stops.length>1?'s':''}</div>
          )}
        </div>
        <div style={{ textAlign:'center', minWidth:80 }}>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--slate-800)', letterSpacing:'-1px' }}>{trip.arrivalTime}</div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--slate-700)' }}>{trip.toCity}</div>
        </div>
      </div>

      {/* Delay notice */}
      {trip.delayMinutes > 0 && (
        <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:8, padding:'6px 12px', fontSize:12, color:'#92400e', marginBottom:12, fontWeight:500 }}>
          ⚠️ Retard de {trip.delayMinutes} minutes
        </div>
      )}

      {/* Info row */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        {trip.platform && (
          <span style={{ fontSize:12, color:'var(--slate-600)', background:'var(--slate-100)', padding:'3px 8px', borderRadius:6 }}>
            🅿️ {trip.platform}
          </span>
        )}
        <span style={{ fontSize:12, color: trip.availableSeats <= 10 ? '#dc2626' : 'var(--slate-600)', background:'var(--slate-100)', padding:'3px 8px', borderRadius:6 }}>
          💺 {trip.availableSeats} place{trip.availableSeats>1?'s':''}
        </span>
        <span style={{ fontSize:12, color:'var(--slate-600)', background:'var(--slate-100)', padding:'3px 8px', borderRadius:6 }}>
          🧳 {trip.baggageAllowance}kg inclus
        </span>
        {trip.amenities?.slice(0,3).map(a => (
          <span key={a} style={{ fontSize:12, background:'var(--slate-100)', padding:'3px 8px', borderRadius:6 }} title={a}>
            {AMENITY_ICONS[a] || a}
          </span>
        ))}
      </div>

      {/* Footer: price + actions */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:'1px solid var(--slate-100)' }}>
        <div>
          <div style={{ fontSize:24, fontWeight:800, color:'var(--primary)', letterSpacing:'-1px' }}>
            {trip.price}€
          </div>
          {trip.vipPrice && (
            <div style={{ fontSize:12, color:'#7c3aed', fontWeight:600 }}>VIP : {trip.vipPrice}€</div>
          )}
          <div style={{ fontSize:11, color:'var(--slate-400)' }}>par personne</div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => toggleCompare(trip)} style={{
            padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:600,
            border: `1.5px solid ${inCompare ? 'var(--primary)' : 'var(--slate-200)'}`,
            background: inCompare ? 'var(--primary-50)' : '#fff',
            color: inCompare ? 'var(--primary)' : 'var(--slate-600)',
          }}>
            {inCompare ? '✓ Comparer' : '+ Comparer'}
          </button>
          {trip.status !== 'cancelled' && trip.status !== 'departed' && (
            <button onClick={() => setBookingTrip(trip)} style={{
              padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:700,
              background: trip.availableSeats === 0 ? 'var(--slate-200)' : 'var(--primary)',
              color: trip.availableSeats === 0 ? 'var(--slate-400)' : '#fff',
              cursor: trip.availableSeats === 0 ? 'not-allowed' : 'pointer',
            }} disabled={trip.availableSeats === 0}>
              {trip.availableSeats === 0 ? 'Complet' : 'Réserver'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

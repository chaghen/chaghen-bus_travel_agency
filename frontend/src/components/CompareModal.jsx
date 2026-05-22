import { useApp } from '../App.jsx';

const TYPE_CFG = {
  standard:  { label: 'Standard',   color: '#475569', bg: '#f1f5f9' },
  premium:   { label: 'Premium',    color: '#7c3aed', bg: '#ede9fe' },
  luxury:    { label: 'Luxe',       color: '#92400e', bg: '#fef3c7' },
  couchette: { label: 'Couchettes', color: '#065f46', bg: '#d1fae5' },
};

const AMENITY_ICONS = { wifi:'📶', ac:'❄️', usb:'🔌', coffee:'☕', snacks:'🍫', tv:'📺', blanket:'🛏' };

export default function CompareModal({ trips, onClose }) {
  const { setBookingTrip } = useApp();
  if (!trips || trips.length < 2) return null;

  // Trouve le meilleur prix parmi les voyages
  const bestPrice = Math.min(...trips.map(t => t.price));

  const rows = [
    { label: '🛣️ Trajet',         render: t => `${t.fromCity} → ${t.toCity}` },
    { label: '🏢 Agence',         render: t => t.agency?.name },
    { label: '⭐ Note',           render: t => t.agency?.rating ? `${t.agency.rating}/5` : '—' },
    { label: '🕐 Départ',         render: t => t.departureTime },
    { label: '🏁 Arrivée',        render: t => t.arrivalTime },
    { label: '⏱️ Durée',          render: t => t.duration },
    { label: '🚩 Arrêts',         render: t => t.stops?.length > 0 ? t.stops.join(', ') : 'Direct' },
    { label: '🚌 Type',           render: t => TYPE_CFG[t.type]?.label || t.type },
    { label: '💺 Places dispo',   render: t => `${t.availableSeats}/${t.totalSeats}` },
    { label: '🧳 Franchise',      render: t => `${t.baggageAllowance}kg inclus` },
    { label: '🛄 Bagage suppl.',  render: t => `+${t.extraBaggagePrice}€/bagage` },
    { label: '✨ Équipements',    render: t => t.amenities?.map(a => AMENITY_ICONS[a] || a).join(' ') || '—' },
    { label: '💶 Prix Standard',  render: t => `${t.price}€`, highlight: t => t.price === bestPrice },
    { label: '⭐ Prix VIP',       render: t => t.vipPrice ? `${t.vipPrice}€` : '—' },
  ];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: '#fff', borderRadius: 20, width: '100%',
        maxWidth: 200 + trips.length * 220,
        maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
          padding: '20px 28px', color: '#fff', flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 2 }}>Comparaison de voyages</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{trips.length} voyages côte à côte</p>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,.7)', fontSize: 24, background: 'none', cursor: 'pointer' }}>×</button>
        </div>

        {/* Table scrollable */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {/* En-têtes voyages */}
            <thead>
              <tr style={{ background: 'var(--slate-50)', position: 'sticky', top: 0, zIndex: 2 }}>
                <th style={{ ...thStyle, width: 160, background: 'var(--slate-50)' }}>Critère</th>
                {trips.map((t, i) => (
                  <th key={t.id} style={{ ...thStyle, background: 'var(--slate-50)', textAlign: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, margin: '0 auto 6px',
                      background: `linear-gradient(135deg, ${t.agency?.colors?.primary || '#2563eb'}, ${t.agency?.colors?.secondary || '#0ea5e9'})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 15,
                    }}>
                      {(t.agency?.name || 'A')[0]}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-800)' }}>{t.agency?.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.label} style={{ background: ri % 2 === 0 ? '#fff' : 'var(--slate-50)' }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--slate-600)', fontSize: 12 }}>
                    {row.label}
                  </td>
                  {trips.map(t => {
                    const value     = row.render(t);
                    const highlight = row.highlight?.(t);
                    return (
                      <td key={t.id} style={{
                        ...tdStyle, textAlign: 'center',
                        background: highlight ? '#f0fdf4' : undefined,
                        color:      highlight ? '#16a34a' : 'var(--slate-700)',
                        fontWeight: highlight ? 700 : 400,
                      }}>
                        {value}
                        {highlight && <span style={{ marginLeft: 4, fontSize: 11 }}>✓ Meilleur prix</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer avec boutons Réserver */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid var(--slate-200)',
          display: 'grid', gridTemplateColumns: `160px ${trips.map(() => '1fr').join(' ')}`,
          gap: 12, flexShrink: 0, background: '#fff',
        }}>
          <div style={{ fontSize: 12, color: 'var(--slate-400)', display: 'flex', alignItems: 'center' }}>
            Choisir ce voyage
          </div>
          {trips.map(t => (
            <button key={t.id} onClick={() => { onClose(); setBookingTrip(t); }} style={{
              padding: '10px', borderRadius: 10,
              background: t.price === bestPrice ? 'var(--primary)' : '#fff',
              color: t.price === bestPrice ? '#fff' : 'var(--primary)',
              border: `2px solid var(--primary)`,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              Réserver {t.price}€
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '.4px', borderBottom: '1px solid var(--slate-200)' };
const tdStyle = { padding: '10px 16px', fontSize: 13, borderBottom: '1px solid var(--slate-100)' };

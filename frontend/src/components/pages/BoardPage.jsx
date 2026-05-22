import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../App.jsx';
import { api } from '../../services/api.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';

const STATUS_CFG = {
  on_time:   { label: "À l'heure",    bg: '#16a34a', dot: '#16a34a' },
  boarding:  { label: 'Embarquement', bg: '#2563eb', dot: '#2563eb' },
  delayed:   { label: 'Retard',       bg: '#d97706', dot: '#d97706' },
  departed:  { label: 'Parti',        bg: '#64748b', dot: '#94a3b8' },
  cancelled: { label: 'Annulé',       bg: '#dc2626', dot: '#dc2626' },
};
const TYPE_CFG = {
  standard:  { label: 'Standard',   color: '#475569', bg: '#f1f5f9' },
  premium:   { label: 'Premium',    color: '#7c3aed', bg: '#ede9fe' },
  luxury:    { label: 'Luxe',       color: '#92400e', bg: '#fef3c7' },
  couchette: { label: 'Couchettes', color: '#065f46', bg: '#d1fae5' },
};

// Hauteur d'une ligne du tableau (px) — doit correspondre au padding réel
const ROW_H = 68;
// Vitesse : pixels par seconde. 40 = lent et lisible
const SPEED = 40;

export default function BoardPage() {
  const { setBookingTrip } = useApp();
  const [allTrips, setAllTrips] = useState([]);
  const [filter, setFilter]     = useState('all');
  const [time, setTime]         = useState(new Date());
  const [wsOk, setWsOk]        = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [paused, setPaused]     = useState(false);

  // Animation refs
  const offsetRef    = useRef(0);          // pixels scrollés (float)
  const rafRef       = useRef(null);
  const lastTsRef    = useRef(null);
  const containerRef = useRef(null);
  const innerRef     = useRef(null);

  // ── Chargement des voyages ─────────────────────────────────────────────────
  useEffect(() => {
    api.searchTrips({}).then(data => {
      // On double la liste pour avoir assez de contenu visible
      setAllTrips(data);
    }).catch(() => {});
  }, []);

  // ── Horloge ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useWebSocket({
    onTripUpdated: (d) => { setAllTrips(p => p.map(t => t.id===d.id ? {...t,...d} : t)); setLastUpdate(new Date()); },
    onTripCreated: (d) => { setAllTrips(p => [...p, d]); setLastUpdate(new Date()); },
    onTripDeleted: (d) => { setAllTrips(p => p.filter(t => t.id!==d.id)); setLastUpdate(new Date()); },
    onTripStatus:  (d) => { setAllTrips(p => p.map(t => t.id===d.id ? {...t,...d} : t)); setLastUpdate(new Date()); },
  });

  // ── Filtrage ───────────────────────────────────────────────────────────────
  const filtered = allTrips.filter(t =>
    filter === 'all'       ? true :
    filter === 'on_time'   ? t.status === 'on_time' :
    filter === 'boarding'  ? t.status === 'boarding' :
    filter === 'delayed'   ? t.status === 'delayed' :
    filter === 'cancelled' ? t.status === 'cancelled' : true
  );

  // Pour l'effet défilant infini on duplique la liste (triple si < 8 éléments)
  const factor  = filtered.length < 6 ? 4 : filtered.length < 12 ? 3 : 2;
  const display = Array.from({ length: factor }, () => filtered).flat();

  const singleH = filtered.length * ROW_H; // hauteur d'une copie

  // ── Boucle d'animation RAF ────────────────────────────────────────────────
  const animate = useCallback((ts) => {
    if (!innerRef.current) return;

    if (lastTsRef.current === null) lastTsRef.current = ts;
    const delta = ts - lastTsRef.current;
    lastTsRef.current = ts;

    if (!paused && singleH > 0) {
      offsetRef.current += (SPEED * delta) / 1000; // pixels à avancer
      // Quand on a scrollé d'une copie complète, on repart à 0 (seamless loop)
      if (offsetRef.current >= singleH) {
        offsetRef.current -= singleH;
      }
      innerRef.current.style.transform = `translateY(-${offsetRef.current}px)`;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [paused, singleH]);

  useEffect(() => {
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Reset offset quand le filtre change
  useEffect(() => {
    offsetRef.current = 0;
    if (innerRef.current) innerRef.current.style.transform = 'translateY(0)';
  }, [filter]);

  const counts = {
    all:       allTrips.length,
    on_time:   allTrips.filter(t => t.status==='on_time').length,
    boarding:  allTrips.filter(t => t.status==='boarding').length,
    delayed:   allTrips.filter(t => t.status==='delayed').length,
    cancelled: allTrips.filter(t => t.status==='cancelled').length,
  };

  const fmt     = (d) => d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const fmtDate = (d) => d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });

  // Hauteur visible du tableau (affiche ~8 lignes)
  const VISIBLE_H = 8 * ROW_H;

  return (
    <div style={{ background: 'var(--board-bg)', minHeight: 'calc(100vh - 60px)', padding: '28px 24px', color: '#fff' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>🚌</div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 2 }}>Départs en Temps Réel</h1>
              <p style={{ color: 'var(--slate-400)', fontSize: 13 }}>Gare Routière BusExpress</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2, color: '#fff', lineHeight: 1 }}>
              {fmt(time)}
            </div>
            <div style={{ color: 'var(--slate-400)', fontSize: 13, marginTop: 4 }}>{fmtDate(time)}</div>
          </div>
        </div>

        {/* ── Filtres ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* WS indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'var(--board-card)', fontSize: 12, color: 'var(--slate-400)', marginRight: 4 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: wsOk ? '#22c55e' : '#f59e0b', display: 'inline-block',
                animation: wsOk ? 'pulse 2s infinite' : 'none',
              }} />
              {wsOk ? 'En direct' : 'Demo'}
            </div>

            {[
              { key: 'all',       label: `Tous`,          count: counts.all },
              { key: 'on_time',   label: `À l'heure`,     count: counts.on_time },
              { key: 'boarding',  label: `Embarquement`,  count: counts.boarding },
              { key: 'delayed',   label: `Retard`,        count: counts.delayed },
              { key: 'cancelled', label: `Annulé`,        count: counts.cancelled },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: filter === key ? 'var(--primary)' : 'var(--board-card)',
                color:      filter === key ? '#fff' : 'var(--slate-400)',
                border:     filter === key ? 'none' : '1px solid var(--board-border)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
              }}>
                {label}
                <span style={{
                  background: filter === key ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)',
                  borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                }}>{count}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Indicateur défilement */}
            <div style={{ fontSize: 12, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {paused
                ? <><span style={{ color: '#f59e0b' }}>⏸</span> Défilement pausé</>
                : <><span style={{ color: '#22c55e', animation: 'pulse 2s infinite', display:'inline-block' }}>▶</span> Défilement en cours</>
              }
            </div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
              Mise à jour : {fmt(lastUpdate)}
            </div>
          </div>
        </div>

        {/* ── Tableau avec défilement ───────────────────────────────────────── */}
        <div style={{
          background: 'var(--board-card)', borderRadius: 16,
          border: '1px solid var(--board-border)', overflow: 'hidden',
        }}>
          {/* En-tête colonnes — fixe */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 110px 130px 80px 80px 90px 150px 110px',
            padding: '12px 20px',
            borderBottom: '2px solid var(--board-border)',
            background: 'rgba(255,255,255,.03)',
          }}>
            {['HEURE','DESTINATION','QUAI','TYPE','DURÉE','PRIX','PLACES','STATUT','ACTION'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: '.8px' }}>{h}</div>
            ))}
          </div>

          {/* Zone de défilement */}
          {filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--slate-500)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 15 }}>Aucun voyage pour ce filtre</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              style={{
                height: VISIBLE_H,
                overflow: 'hidden',
                position: 'relative',
                // Fondu en haut et en bas pour l'effet "défilement naturel"
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)',
              }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div ref={innerRef} style={{ willChange: 'transform' }}>
                {display.map((trip, i) => (
                  <TripRow
                    key={`${trip.id}-${i}`}
                    trip={trip}
                    onBook={() => setBookingTrip(trip)}
                    rowH={ROW_H}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Légende statuts ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_CFG).map(([key, s]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--slate-500)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
              {s.label}
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--slate-600)', fontStyle: 'italic' }}>
            Survoler le tableau pour mettre en pause
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Ligne du tableau ──────────────────────────────────────────────────────── */
function TripRow({ trip, onBook, rowH }) {
  const s = STATUS_CFG[trip.status] || STATUS_CFG.on_time;
  const t = TYPE_CFG[trip.type]     || TYPE_CFG.standard;
  const isLow          = trip.availableSeats <= 8;
  const agencyInitial  = (trip.agency?.name || 'A')[0];
  const agencyColor    = trip.agency?.colors?.primary || '#2563eb';
  const agencyColor2   = trip.agency?.colors?.secondary || '#0ea5e9';
  const isCancelled    = trip.status === 'cancelled';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '90px 1fr 110px 130px 80px 80px 90px 150px 110px',
      padding: '0 20px',
      height: rowH,
      alignItems: 'center',
      borderBottom: '1px solid rgba(51,65,85,.4)',
      background: trip.status === 'boarding'  ? 'rgba(37,99,235,.07)'  :
                  trip.status === 'cancelled'  ? 'rgba(220,38,38,.05)'  :
                  trip.status === 'delayed'    ? 'rgba(217,119,6,.04)'  : 'transparent',
      transition: 'background .2s',
      cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
      onMouseLeave={e => e.currentTarget.style.background =
        trip.status === 'boarding' ? 'rgba(37,99,235,.07)' :
        trip.status === 'cancelled' ? 'rgba(220,38,38,.05)' :
        trip.status === 'delayed' ? 'rgba(217,119,6,.04)' : 'transparent'
      }
    >
      {/* Heure */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: s.dot, flexShrink: 0,
          boxShadow: trip.status === 'boarding' ? `0 0 6px ${s.dot}` : 'none',
          animation: trip.status === 'boarding' ? 'pulse 1.5s infinite' : 'none',
        }} />
        <span style={{
          fontFamily: 'monospace', fontWeight: 700, fontSize: 17,
          color: isCancelled ? 'var(--slate-600)' : '#fff', letterSpacing: .5,
        }}>
          {trip.departureTime}
        </span>
      </div>

      {/* Destination */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7, flexShrink: 0,
          background: `linear-gradient(135deg, ${agencyColor}, ${agencyColor2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#fff',
          opacity: isCancelled ? .5 : 1,
        }}>{agencyInitial}</div>
        <div>
          <div style={{
            fontWeight: 700, fontSize: 15,
            color: isCancelled ? 'var(--slate-500)' : '#fff',
            textDecoration: isCancelled ? 'line-through' : 'none',
          }}>
            {trip.toCity}
          </div>
          <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{trip.agency?.name}</div>
        </div>
      </div>

      {/* Quai */}
      <div>
        <span style={{
          background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600,
          color: 'var(--slate-300)',
        }}>
          {trip.platform || '—'}
        </span>
      </div>

      {/* Type */}
      <div>
        <span style={{
          background: t.bg + '1A', color: t.color,
          borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600,
        }}>{t.label}</span>
      </div>

      {/* Durée */}
      <div style={{ fontSize: 13, color: 'var(--slate-300)', fontWeight: 500 }}>{trip.duration}</div>

      {/* Prix */}
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-light,#3b82f6)', fontFamily: 'monospace' }}>
        {trip.price}€
      </div>

      {/* Places */}
      <div style={{
        fontSize: 13, fontWeight: 700,
        color: isLow ? '#f87171' : '#4ade80',
      }}>
        {trip.availableSeats === 0 ? 'Complet' : `${trip.availableSeats} pl.`}
      </div>

      {/* Statut */}
      <div>
        <span style={{
          background: s.bg + '1A', color: s.bg === '#64748b' ? '#94a3b8' : s.bg,
          borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700,
          border: `1px solid ${s.bg}33`,
          whiteSpace: 'nowrap',
        }}>
          {trip.status === 'delayed' && trip.delayMinutes > 0 ? `⚠ +${trip.delayMinutes}min` : s.label}
        </span>
      </div>

      {/* Action */}
      <div>
        {!isCancelled && trip.status !== 'departed' && trip.availableSeats > 0 ? (
          <button onClick={onBook} style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'var(--primary)', color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
            transition: 'opacity .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Réserver</button>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--slate-600)' }}>
            {isCancelled ? '—' : trip.availableSeats === 0 ? 'Complet' : '—'}
          </span>
        )}
      </div>
    </div>
  );
}

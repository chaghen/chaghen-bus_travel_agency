import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../App.jsx';
import { api } from '../../services/api.js';
import TripCard from '../TripCard.jsx';

const CITIES = ['','Paris','Lyon','Marseille','Bordeaux','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Lille','Rennes','Grenoble'];
const TYPES  = [{ v:'', l:'Tous' },{ v:'standard', l:'Standard' },{ v:'premium', l:'Premium' },{ v:'luxury', l:'Luxe' },{ v:'couchette', l:'Couchettes' }];
const SORTS  = [{ v:'departureTime', l:'Heure de départ' },{ v:'price', l:'Prix croissant' },{ v:'availableSeats', l:'Places dispo' }];

export default function SearchPage() {
  const { searchParams, setSearchParams, agencies } = useApp();

  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [filters, setFilters]   = useState({
    fromCity: searchParams.fromCity || '',
    toCity:   searchParams.toCity   || '',
    date:     searchParams.date     || '',
    type:     '',
    agencyId: '',
    sortBy:   'departureTime',
    maxPrice: '',
  });

  const search = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([,v]) => v !== ''));
      const data = await api.searchTrips(params);
      setResults(data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { search(filters); }, []); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ fromCity: filters.fromCity, toCity: filters.toCity, date: filters.date });
    search(filters);
  };

  const set = (k, v) => setFilters(f => ({...f, [k]: v}));

  return (
    <div style={{ minHeight:'100vh', background:'var(--slate-50)' }}>
      {/* Top search bar */}
      <div style={{ background:'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', padding:'24px' }}>
        <form onSubmit={handleSearch} style={{ maxWidth:1200, margin:'0 auto', display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          {[
            { label:'Départ',   key:'fromCity', type:'select', options:CITIES },
            { label:'Arrivée',  key:'toCity',   type:'select', options:CITIES },
            { label:'Date (optionnel)', key:'date', type:'date' },
          ].map(({ label, key, type, options }) => (
            <div key={key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.8)', textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</label>
              {type === 'select' ? (
                <select value={filters[key]} onChange={e => set(key, e.target.value)} style={topInputStyle}>
                  {options.map(c => <option key={c} value={c}>{c || 'Toutes'}</option>)}
                </select>
              ) : (
                <input type={type} value={filters[key]} onChange={e => set(key, e.target.value)} style={topInputStyle} />
              )}
            </div>
          ))}
          <button type="submit" style={{
            padding:'10px 24px', borderRadius:8, background:'#f59e0b',
            color:'#000', fontWeight:700, fontSize:14, height:40,
          }}>Rechercher</button>
        </form>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'260px 1fr', gap:28 }}>
        {/* Sidebar filters */}
        <aside>
          <div style={{ background:'#fff', border:'1px solid var(--slate-200)', borderRadius:14, padding:20, position:'sticky', top:80 }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:'var(--slate-800)' }}>Filtres</h3>

            {/* Type */}
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Type de bus</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {TYPES.map(t => (
                  <label key={t.v} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', color:'var(--slate-700)' }}>
                    <input type="radio" name="type" value={t.v} checked={filters.type === t.v}
                      onChange={() => set('type', t.v)} />
                    {t.l}
                  </label>
                ))}
              </div>
            </div>

            {/* Agency */}
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Agence</label>
              <select value={filters.agencyId} onChange={e => set('agencyId', e.target.value)} style={sideInputStyle}>
                <option value="">Toutes les agences</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* Max price */}
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Prix max : {filters.maxPrice ? filters.maxPrice + '€' : 'Tous'}</label>
              <input type="range" min="20" max="200" step="5"
                value={filters.maxPrice || 200}
                onChange={e => set('maxPrice', e.target.value === '200' ? '' : e.target.value)}
                style={{ width:'100%' }} />
            </div>

            {/* Sort */}
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Trier par</label>
              <select value={filters.sortBy} onChange={e => set('sortBy', e.target.value)} style={sideInputStyle}>
                {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>

            <button onClick={() => {
              const reset = { fromCity:'', toCity:'', date:'', type:'', agencyId:'', sortBy:'departureTime', maxPrice:'' };
              setFilters(reset);
              search(reset);
            }} style={{ width:'100%', padding:'8px', borderRadius:8, border:'1px solid var(--slate-200)', color:'var(--slate-500)', fontSize:13, background:'none' }}>
              Réinitialiser
            </button>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:'var(--slate-800)' }}>
              {loading ? 'Recherche…' : `${results.length} voyage${results.length !== 1 ? 's' : ''} trouvé${results.length !== 1 ? 's' : ''}`}
            </h2>
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
              <div style={{ width:40, height:40, border:'3px solid var(--slate-200)', borderTopColor:'var(--primary)', borderRadius:'50%' }} className="spinning" />
            </div>
          ) : results.length === 0 ? (
            <div style={{ background:'#fff', border:'1px solid var(--slate-200)', borderRadius:14, padding:60, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🚌</div>
              <h3 style={{ fontWeight:700, color:'var(--slate-700)', marginBottom:8 }}>Aucun voyage trouvé</h3>
              <p style={{ color:'var(--slate-400)', fontSize:14 }}>Modifiez vos critères de recherche pour voir plus de résultats.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {results.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const topInputStyle = {
  padding:'9px 12px', borderRadius:8, fontSize:13,
  border:'1px solid rgba(255,255,255,.3)', background:'rgba(255,255,255,.15)',
  color:'#fff', height:40, minWidth:140,
};
const labelStyle = { fontSize:12, fontWeight:600, color:'var(--slate-500)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'.4px' };
const sideInputStyle = { width:'100%', padding:'8px 10px', borderRadius:8, fontSize:13, border:'1px solid var(--slate-200)', background:'var(--slate-50)', color:'var(--slate-700)' };

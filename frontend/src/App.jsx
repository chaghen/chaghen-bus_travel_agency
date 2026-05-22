import { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from './services/api.js';
import Navbar from './components/layout/Navbar.jsx';
import HomePage from './components/pages/HomePage.jsx';
import SearchPage from './components/pages/SearchPage.jsx';
import BoardPage from './components/pages/BoardPage.jsx';
import AgencyDashboard from './components/pages/AgencyDashboard.jsx';
import AdminPage from './components/pages/AdminPage.jsx';
import RegisterPage from './components/pages/RegisterPage.jsx';
import RegisterUserPage from './components/pages/RegisterUserPage.jsx';
import BookingModal from './components/BookingModal.jsx';
import CompareModal from './components/CompareModal.jsx';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const WS_URL       = import.meta.env.VITE_WS_URL || 'http://localhost:4000';
const SESSION_KEY  = 'busexpress_session';

/* ── Helpers localStorage ────────────────────────────────────────────────── */
function saveSession(user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch {}
}
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    // Vérifier que le token n'est pas expiré
    if (!u?.token) return null;
    const payload = JSON.parse(atob(u.token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return u;
  } catch { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

export default function App() {
  const [page, setPage]               = useState('home');
  const [trips, setTrips]             = useState([]);
  const [agencies, setAgencies]       = useState([]);
  const [user, setUser]               = useState(() => loadSession()); // ← restaure depuis localStorage
  const [bookingTrip, setBookingTrip] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [searchParams, setSearchParams] = useState({ fromCity: '', toCity: '', date: '' });
  const [loading, setLoading]         = useState(true);

  const socketRef = useRef(null);

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    api.getAgencies().then(setAgencies).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadTrips = useCallback(async (params = {}) => {
    try { const d = await api.searchTrips(params); setTrips(d); return d; }
    catch { return []; }
  }, []);
  useEffect(() => { loadTrips(); }, [loadTrips]);

  // ── WebSocket global (trips + agencies) ───────────────────────────────────
  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket','polling'], reconnectionDelay: 2000 });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe:trips');
      socket.emit('subscribe:agencies'); // ← nouveau : écouter les agences
    });

    // Événements trips
    socket.on('trip:updated', (d) => setTrips(p => p.map(t => t.id===d.id ? {...t,...d} : t)));
    socket.on('trip:created', (d) => setTrips(p => [d,...p]));
    socket.on('trip:deleted', (d) => setTrips(p => p.filter(t => t.id!==d.id)));
    socket.on('trip:status',  (d) => setTrips(p => p.map(t => t.id===d.id ? {...t,...d} : t)));

    // Événements agences ← nouveau
    socket.on('agency:updated', (data) => {
      const { action, status } = data;
      if (action === 'activated') {
        // L'agence est maintenant active → recharger la liste publique
        api.getAgencies().then(setAgencies).catch(() => {});
      } else if (action === 'deactivated') {
        // Retirer l'agence de la liste publique
        setAgencies(prev => prev.filter(a => a.id !== data.id));
      } else if (action === 'created') {
        // Nouvelle agence inscrite — rien à faire sur la liste publique (pending)
        // mais on peut notifier l'admin via un badge
        console.log('[WS] Nouvelle agence en attente de validation:', data.name);
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res     = await api.login(email, password);
    const payload = JSON.parse(atob(res.token.split('.')[1]));
    const roles   = payload.roles || [];
    const u = {
      token:    res.token,
      email,
      role:     roles.includes('ROLE_ADMIN') ? 'admin' : 'agency_admin',
      roles,
      agencyId: payload.agencyId || null,
      name:     payload.name || email.split('@')[0],
      type:     'agency',
    };
    setUser(u);
    saveSession(u); // ← persiste dans localStorage
    return res;
  }, []);

  const loginAsUser = useCallback(async (email, password) => {
    const res     = await api.loginUser(email, password);
    const payload = JSON.parse(atob(res.token.split('.')[1]));
    const token   = res.token;
    let profile = {};
    try { profile = await api.getMe(token); } catch {}
    const u = {
      token,
      email,
      role:      'user',
      roles:     payload.roles || ['ROLE_USER'],
      name:      profile.fullName || payload.name || email.split('@')[0],
      firstName: profile.firstName ?? payload.firstName ?? '',
      lastName:  profile.lastName  ?? payload.lastName  ?? '',
      phone:     profile.phone     ?? '',
      type:      'user',
    };
    setUser(u);
    saveSession(u); // ← persiste dans localStorage
    return res;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearSession(); // ← efface du localStorage
    setPage('home');
  }, []);

  const toggleCompare = useCallback((trip) => {
    setCompareList(prev => {
      const exists = prev.find(t => t.id === trip.id);
      if (exists) return prev.filter(t => t.id !== trip.id);
      if (prev.length >= 3) return prev;
      return [...prev, trip];
    });
  }, []);

  const nav = useCallback((p, params) => {
    if (params) setSearchParams(sp => ({ ...sp, ...params }));
    setPage(p);
    window.scrollTo(0, 0);
  }, []);

  const ctx = {
    page, nav,
    trips, setTrips, loadTrips,
    agencies, setAgencies,
    user, setUser, login, loginAsUser, logout,
    bookingTrip, setBookingTrip,
    compareList, toggleCompare, setCompareList,
    showCompare, setShowCompare,
    searchParams, setSearchParams,
    socket: socketRef,
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--primary)', color:'#fff', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, border:'4px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%' }} className="spinning" />
      <p style={{ fontWeight:600, fontSize:18 }}>Chargement de BusExpress…</p>
    </div>
  );

  const fullPage = ['register','register-user'].includes(page);

  return (
    <AppContext.Provider value={ctx}>
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        {!fullPage && <Navbar />}
        <main style={{ flex:1 }}>
          {page === 'home'          && <HomePage />}
          {page === 'search'        && <SearchPage />}
          {page === 'board'         && <BoardPage />}
          {page === 'agency'        && <AgencyDashboard />}
          {page === 'admin'         && <AdminPage />}
          {page === 'register'      && <RegisterPage />}
          {page === 'register-user' && <RegisterUserPage />}
        </main>

        {bookingTrip && <BookingModal />}

        {showCompare && compareList.length >= 2 && (
          <CompareModal trips={compareList} onClose={() => setShowCompare(false)} />
        )}

        {/* Barre de comparaison */}
        {compareList.length >= 1 && (
          <div style={{
            position:'fixed', bottom:0, left:0, right:0, zIndex:500,
            background:'#1e3a8a', color:'#fff',
            padding:'12px 24px', display:'flex', alignItems:'center', gap:16,
            boxShadow:'0 -4px 20px rgba(0,0,0,.3)',
          }}>
            <span style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap' }}>
              Comparer ({compareList.length}/3)
            </span>
            <div style={{ display:'flex', gap:8, flex:1, flexWrap:'wrap' }}>
              {compareList.map(t => (
                <span key={t.id} style={{
                  background:'rgba(255,255,255,.18)', borderRadius:6,
                  padding:'4px 10px', fontSize:13, display:'flex', alignItems:'center', gap:6,
                }}>
                  {t.fromCity} → {t.toCity}
                  <button onClick={() => setCompareList(p => p.filter(x => x.id !== t.id))}
                    style={{ background:'none', color:'rgba(255,255,255,.8)', fontSize:18, lineHeight:1, padding:0, cursor:'pointer', border:'none' }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, flexShrink:0 }}>
              {compareList.length >= 2 ? (
                <button onClick={() => setShowCompare(true)} style={{
                  background:'#f59e0b', color:'#000', fontWeight:800, fontSize:13,
                  padding:'8px 20px', borderRadius:8, cursor:'pointer', border:'none',
                }}>Comparer →</button>
              ) : (
                <span style={{ fontSize:12, color:'rgba(255,255,255,.6)', alignSelf:'center' }}>
                  Sélectionnez encore {2 - compareList.length} voyage{2 - compareList.length > 1 ? 's' : ''}
                </span>
              )}
              <button onClick={() => { setCompareList([]); setShowCompare(false); }}
                style={{ color:'rgba(255,255,255,.7)', fontSize:13, padding:'6px 12px', background:'rgba(255,255,255,.1)', border:'none', borderRadius:6, cursor:'pointer' }}>
                Effacer
              </button>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

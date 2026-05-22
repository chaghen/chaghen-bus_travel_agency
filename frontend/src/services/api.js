const BASE = '/api';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // Erreur réseau (API down, CORS, etc.)
    throw { status: 0, message: 'Impossible de joindre le serveur. Vérifiez que l\'API est démarrée.' };
  }

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  // Si la réponse n'est pas du JSON (page HTML d'erreur du proxy, etc.)
  if (!contentType.includes('application/json') && !contentType.includes('json')) {
    if (!res.ok) {
      throw { status: res.status, message: `Erreur serveur (${res.status}) — l'API est-elle démarrée ?` };
    }
    return text || null;
  }

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // JSON malformé
    if (!res.ok) {
      throw { status: res.status, message: `Réponse invalide du serveur (${res.status})` };
    }
    return null;
  }

  if (!res.ok) {
    throw { status: res.status, message: json?.error || json?.message || `Erreur ${res.status}` };
  }

  return json;
}

export const api = {
  // ── Auth agence ──────────────────────────────────────────────────────────
  login:           (email, password) => req('POST', '/auth/login',        { email, password }),
  register:        (data)            => req('POST', '/auth/register',       data),

  // ── Auth voyageur ─────────────────────────────────────────────────────────
  loginUser:       (email, password) => req('POST', '/auth/login-user',    { email, password }),
  registerUser:    (data)            => req('POST', '/auth/register-user',  data),

  // ── Profil voyageur ───────────────────────────────────────────────────────
  getMe:           (token)           => req('GET',  '/user/me',            null, token),
  updateMe:        (data, token)     => req('PUT',  '/user/me',            data, token),

  // ── Agences (public) ──────────────────────────────────────────────────────
  getAgencies:     ()                => req('GET',  '/agencies'),
  getAgency:       (id)              => req('GET',  `/agencies/${id}`),

  // ── Agences (admin) ───────────────────────────────────────────────────────
  adminGetAgencies: (token)          => req('GET',  '/admin/agencies',                null, token),
  adminActivate:    (id, token)      => req('POST', `/admin/agencies/${id}/activate`,  null, token),
  adminDeactivate:  (id, token)      => req('POST', `/admin/agencies/${id}/deactivate`,null, token),
  adminPromote:     (id, token)      => req('POST', `/admin/agencies/${id}/promote`,   null, token),
  adminDemote:      (id, token)      => req('POST', `/admin/agencies/${id}/demote`,    null, token),

  // ── Voyages (public) ──────────────────────────────────────────────────────
  searchTrips: (params) => req('GET', '/trips?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null))
  ).toString()),
  getTrip: (id) => req('GET', `/trips/${id}`),

  // ── Voyages (agence) ──────────────────────────────────────────────────────
  createTrip:   (data, token)        => req('POST',   '/trips',              data, token),
  updateTrip:   (id, data, token)    => req('PUT',    `/trips/${id}`,         data, token),
  deleteTrip:   (id, token)          => req('DELETE', `/trips/${id}`,         null, token),
  updateStatus: (id, data, token)    => req('POST',   `/trips/${id}/status`,  data, token),

  // ── Réservations ─────────────────────────────────────────────────────────
  createBooking: (data, token)       => req('POST', '/bookings',               data, token),
  getBooking:    (ref)               => req('GET',  `/bookings/${ref}`),
  cancelBooking: (ref)               => req('POST', `/bookings/${ref}/cancel`),
};

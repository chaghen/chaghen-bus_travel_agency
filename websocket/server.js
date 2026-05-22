'use strict';
const { createServer } = require('http');
const { Server }       = require('socket.io');
const { createAdapter }= require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const WS_PORT  = parseInt(process.env.WS_PORT  || '4000');
const REDIS_URL = process.env.REDIS_URL         || 'redis://localhost:6379';

const pubClient  = createClient({ url: REDIS_URL });
const subClient  = pubClient.duplicate();
const subTrips   = pubClient.duplicate(); // canal busexpress:trips
const subAgencies= pubClient.duplicate(); // canal busexpress:agencies

const http = createServer();
const io   = new Server(http, {
  cors: { origin: '*', methods: ['GET','POST'] },
  transports: ['websocket','polling'],
});

io.on('connection', (socket) => {
  console.log(`[WS] connected ${socket.id}`);

  // Tableau des départs (tous les voyages)
  socket.on('subscribe:trips', () => {
    socket.join('trips:board');
    socket.emit('subscribed', { room: 'trips:board' });
  });

  // Dashboard agence (voyages d'une agence spécifique)
  socket.on('subscribe:agency', ({ agencyId }) => {
    if (agencyId) socket.join(`agency:${agencyId}`);
  });

  // Abonnement aux updates d'agences (admin panel, accueil)
  socket.on('subscribe:agencies', () => {
    socket.join('agencies:all');
    socket.emit('subscribed', { room: 'agencies:all' });
  });

  socket.on('disconnect', () => console.log(`[WS] disconnected ${socket.id}`));
});

async function start() {
  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
    subTrips.connect(),
    subAgencies.connect(),
  ]);

  io.adapter(createAdapter(pubClient, subClient));

  // ── Canal voyages ─────────────────────────────────────────────────────────
  await subTrips.subscribe('busexpress:trips', (raw) => {
    try {
      const { event, data } = JSON.parse(raw);
      console.log(`[Trip event] ${event} id=${data?.id}`);
      io.to('trips:board').emit(event, data);
      if (data?.agency?.id) io.to(`agency:${data.agency.id}`).emit(event, data);
    } catch(e) { console.error('[trips parse error]', e.message); }
  });

  // ── Canal agences ─────────────────────────────────────────────────────────
  await subAgencies.subscribe('busexpress:agencies', (raw) => {
    try {
      const { event, data } = JSON.parse(raw);
      console.log(`[Agency event] ${event} id=${data?.id} action=${data?.action}`);
      // Broadcast à tous les clients abonnés aux agences (accueil, admin)
      io.to('agencies:all').emit(event, data);
    } catch(e) { console.error('[agencies parse error]', e.message); }
  });

  http.listen(WS_PORT, () => console.log(`[WS] listening on :${WS_PORT}`));
}

start().catch(e => { console.error(e); process.exit(1); });

process.on('SIGTERM', () => { io.close(); process.exit(0); });
process.on('SIGINT',  () => { io.close(); process.exit(0); });

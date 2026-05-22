import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

/**
 * Hook WebSocket autonome — utilisé par les composants qui ont besoin
 * d'écouter des événements spécifiques (BoardPage, AgencyDashboard).
 * App.jsx gère sa propre connexion pour les trips/agencies globaux.
 */
export function useWebSocket({ onTripUpdated, onTripCreated, onTripDeleted, onTripStatus } = {}) {
  const socketRef   = useRef(null);
  const callbackRef = useRef({ onTripUpdated, onTripCreated, onTripDeleted, onTripStatus });

  // Mettre à jour les callbacks sans recréer la connexion
  useEffect(() => {
    callbackRef.current = { onTripUpdated, onTripCreated, onTripDeleted, onTripStatus };
  });

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe:trips');
    });

    socket.on('trip:updated', (d) => callbackRef.current.onTripUpdated?.(d));
    socket.on('trip:created', (d) => callbackRef.current.onTripCreated?.(d));
    socket.on('trip:deleted', (d) => callbackRef.current.onTripDeleted?.(d));
    socket.on('trip:status',  (d) => callbackRef.current.onTripStatus?.(d));

    return () => { socket.disconnect(); };
  }, []);

  const subscribeAgency = useCallback((agencyId) => {
    socketRef.current?.emit('subscribe:agency', { agencyId });
  }, []);

  const isConnected = () => socketRef.current?.connected ?? false;

  return { socket: socketRef, subscribeAgency, isConnected };
}

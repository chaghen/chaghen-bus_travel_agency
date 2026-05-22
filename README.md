# 🚌 BusExpress — Plateforme de réservation de bus

Stack complète : **React + Symfony 7 + Socket.IO + Redis + RabbitMQ + PostgreSQL**  
Tout fonctionne avec **une seule commande** : `docker compose up`

---

## 🚀 Démarrage en 1 commande

```bash
docker compose up --build
```

Puis ouvrir → **http://localhost:5173**

Au premier démarrage, l'API :
1. Attend PostgreSQL
2. Génère les clés JWT
3. Exécute les migrations
4. Charge les fixtures (4 agences, 8 voyages)

---

## 🌐 Services disponibles

| Service          | URL                         |
|------------------|-----------------------------|
| Frontend React   | http://localhost:5173       |
| Symfony API      | http://localhost:8000       |
| WebSocket        | http://localhost:4000       |
| RabbitMQ UI      | http://localhost:15672      |
| PostgreSQL       | localhost:5432              |

RabbitMQ UI → login : `busexpress` / `busexpress_secret`

---

## 👤 Comptes de démonstration

| Rôle           | Email                       | Mot de passe  |
|----------------|-----------------------------|---------------|
| Agence 1       | contact@transexpress.fr     | password123   |
| Agence 2       | info@rivierabus.fr          | password123   |
| Agence 3       | contact@atlanticlines.fr    | password123   |
| (Pending)      | bonjour@alpesvoyages.fr     | password123   |

> **Note Admin** : Pour tester le compte admin, ajoutez manuellement dans la BD un enregistrement avec `ROLE_ADMIN` ou modifiez le JWT dans `AgencyController`.

---

## ⚡ Flux temps réel

```
Agence modifie un voyage (via Dashboard)
     ↓
Symfony API → TripController → PUT /api/trips/{id}
     ↓
Symfony Messenger → dispatch(TripUpdatedMessage)
     ↓
RabbitMQ (queue: messages)
     ↓
TripUpdatedMessageHandler → Redis PUBLISH busexpress:trips
     ↓
Node.js Socket.IO ← Redis SUBSCRIBE busexpress:trips
     ↓
io.to('trips:board').emit('trip:updated', data)
     ↓
React BoardPage ← socket.on('trip:updated') → mise à jour instantanée
```

---

## 📡 Endpoints API

### Publics
| Méthode | Endpoint              | Description            |
|---------|-----------------------|------------------------|
| GET     | /api/trips            | Liste/recherche voyages |
| GET     | /api/trips/{id}       | Détail voyage          |
| GET     | /api/agencies         | Agences actives        |
| POST    | /api/bookings         | Créer réservation      |
| GET     | /api/bookings/{ref}   | Voir réservation       |
| POST    | /api/bookings/{ref}/cancel | Annuler         |

### Agence (JWT requis)
| Méthode | Endpoint                   | Description        |
|---------|----------------------------|--------------------|
| POST    | /api/auth/login            | Connexion          |
| POST    | /api/trips                 | Créer voyage       |
| PUT     | /api/trips/{id}            | Modifier voyage    |
| DELETE  | /api/trips/{id}            | Supprimer voyage   |
| POST    | /api/trips/{id}/status     | Changer statut     |

### Admin (JWT ROLE_ADMIN)
| Méthode | Endpoint                          | Description       |
|---------|-----------------------------------|-------------------|
| GET     | /api/admin/agencies               | Toutes les agences|
| POST    | /api/admin/agencies/{id}/activate | Activer agence    |
| POST    | /api/admin/agencies/{id}/deactivate | Désactiver      |

---

## 🔑 Recherche de voyages

```
GET /api/trips?fromCity=Paris&toCity=Lyon&date=2026-05-20&type=premium&sortBy=price
```

Paramètres disponibles : `fromCity`, `toCity`, `date`, `type`, `agencyId`, `minPrice`, `maxPrice`, `sortBy`

---

## 🗂 Structure du projet

```
busexpress/
├── docker-compose.yml          ← Lance tout
├── frontend/                   ← React + Vite
│   ├── Dockerfile
│   └── src/
│       ├── App.jsx             ← Contexte global + routing
│       ├── components/
│       │   ├── layout/Navbar.jsx
│       │   ├── pages/
│       │   │   ├── HomePage.jsx
│       │   │   ├── SearchPage.jsx
│       │   │   ├── BoardPage.jsx      ← Temps réel WS
│       │   │   ├── AgencyDashboard.jsx← CRUD + statuts
│       │   │   └── AdminPage.jsx
│       │   ├── TripCard.jsx
│       │   ├── BookingModal.jsx
│       │   └── LoginModal.jsx
│       ├── hooks/useWebSocket.js
│       └── services/api.js     ← Tous les appels Symfony
├── backend/                    ← Symfony 7
│   ├── Dockerfile
│   ├── docker-entrypoint.sh   ← Migrations + fixtures auto
│   └── src/
│       ├── Controller/         ← Trip, Agency, Booking
│       ├── Entity/             ← Trip, Agency, Booking
│       ├── Message/            ← TripUpdatedMessage
│       ├── MessageHandler/     ← → Redis pub
│       ├── Repository/
│       └── DataFixtures/
├── websocket/                  ← Node.js Socket.IO
│   ├── Dockerfile
│   └── server.js               ← Redis sub → broadcast
```

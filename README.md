# Fullstack Final - Realtime Chat Platform

🧰 **Tech stack:** </br>
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![ExpressJS](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DD0031?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

A realtime chat application with a React frontend, Express backend, Socket.IO messaging, and WebRTC voice/video calls.

## Key Features

- User registration, login, refresh token, and logout
- User profile management with avatars and privacy options
- Friend requests, suggestions, block/unblock
- One-on-one and group chat
- Text, emoji, file sharing, message edit/delete, reactions
- Online/offline presence via Socket.IO
- Realtime voice and video calls using WebRTC
- Redis adapter support for scaling Socket.IO across multiple backend instances
- Nginx reverse proxy for frontend, API, and WebSocket routing

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Socket.IO Client, WebRTC, Lucide React
- Backend: Node.js, Express, PostgreSQL, MongoDB, Redis, Socket.IO, JWT, Multer
- Infrastructure: Docker Compose, Nginx

## Project Structure

```text
.
├── be-fullstack/          # Backend Express + Socket.IO
│   ├── config/            # Database and socket configuration
│   ├── database/          # SQL files and backups
│   ├── src/
│   │   ├── middleware/    # Auth and upload middleware
│   │   ├── modules/       # Features: auth, users, friends, messages, groups...
│   │   ├── socketio/      # Socket.IO handlers
│   │   └── utils/         # JWT utilities
│   └── uploads/           # Uploaded files
├── fe-fullstack/          # Frontend React/Vite app
│   ├── public/
│   └── src/
│       ├── api/           # HTTP clients
│       ├── components/    # UI and chat components
│       ├── context/       # App context providers
│       ├── hooks/
│       ├── pages/
│       ├── socket/        # Socket.IO client setup
│       └── webRTC/        # WebRTC peer logic
├── ngix/                  # Nginx proxy config
└── docker-compose.yml
```

## Requirements

- Node.js 20+
- npm
- Docker and Docker Compose for container deployment
- PostgreSQL, MongoDB, and Redis for local development (if not using Docker)

## Setup

### Backend

1. Open a terminal in `be-fullstack`
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your local database and Redis values.
4. Start the backend:

```bash
npm run dev
```

Default backend URL:

```text
http://localhost:8000
```

### Frontend

1. Open a separate terminal in `fe-fullstack`
2. Install dependencies:

```bash
npm install
```

3. Start the frontend:

```bash
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

## Docker Compose

Use Docker Compose to start the full stack setup:

```bash
docker compose up -d
```

Stop containers:

```bash
docker compose down
```

Remove volumes:

```bash
docker compose down -v
```

## Useful Scripts

### Backend

```bash
npm run dev          # Run backend with nodemon
npm start            # Run backend with node
npm run migrate      # Run database migrations
npm run migrate:down # Roll back migrations
npm run seed         # Seed sample data
```

### Frontend

```bash
npm run dev      # Start Vite development server
npm run build    # Build production files
npm run preview  # Preview production build
npm run lint     # Run ESLint checks
```

## API Overview

The backend exposes routes under `/api`.

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users

- `POST /api/users/register`

- `GET /api/users`
- `GET /api/users/search`
- `GET /api/users/:id`
- `PATCH /api/users/profile`
- `DELETE /api/users/:id`

### Friends

- `POST /api/friends/request`
- `PUT /api/friends/accept`
- `GET /api/friends`
- `GET /api/friends/suggestions`
- `GET /api/friends/pending`
- `GET /api/friends/relationships`
- `GET /api/friends/blocked`
- `POST /api/friends/block/:id`
- `DELETE /api/friends/block/:id`
- `DELETE /api/friends/remove/:id`

### Conversations

- `POST /api/conversations/direct`
- `POST /api/conversations/group`
- `GET /api/conversations`

### Messages

- `POST /api/messages/direct`
- `POST /api/messages/group`
- `POST /api/messages/direct/file`
- `POST /api/messages/group/file`
- `GET /api/messages/:conversationId`
- `GET /api/messages/item/:messageId`
- `PATCH /api/messages/:messageId`
- `POST /api/messages/:messageId/recall`
- `POST /api/messages/:messageId/reactions`

### Groups

- `GET /api/groups`
- `POST /api/groups`
- `GET /api/groups/:id`
- `PATCH /api/groups/:id`
- `DELETE /api/groups/:id`
- `POST /api/groups/:id/leave`
- `POST /api/groups/:id/members`
## Socket.IO Events

The socket client connects to `/socket.io` and sends the JWT through `auth.token`.

### Presence

- Client emits `register`
- Client emits `set_online_visibility`
- Server emits `getOnlineUsers`

### Chat

- Client emits `join_conversation`
- Client emits `send_message`
- Client emits `typing`
- Server emits `receive_message`
- Server emits `typing`

### Call / WebRTC

- Client emits `call_user`
- Server emits `incoming_call`
- Client emits `answer_call`
- Server emits `call_accepted`
- Client/server relay `ice_candidate`
- Client/server relay `call_media_toggle`
- Client emits `end_call`
- Server emits `call_ended`
- Server emits `call_unavailable`

## Voice/Video Calling

The calling feature uses WebRTC, so please note:

- Camera and microphone access only work on secure origins: `https://`, `localhost`, or browser-approved environments.
- Both clients must be connected to Socket.IO in order to exchange offer/answer and ICE candidates.
- Google STUN servers are currently configured in `fe-fullstack/src/webRTC/peer.js`.

## Quick Test After Setup

1. Start Docker containers.
2. Register two accounts.
3. Add friends or create a direct conversation.
4. Send messages.
5. Test voice/video calls between two browsers or devices.

## Troubleshooting

### Unable to connect to Socket.IO

- Ensure the backend is running on port `8000`.
- Check the `/socket.io` proxy configuration in `fe-fullstack/vite.config.js` or `ngix/nginx.conf`.
- Verify that the authentication token is still valid.
- If using scaled backend instances, ensure Redis is running and `REDIS_URL` is configured correctly.

### Camera or microphone not working

- Check browser permissions for camera and microphone access.
- Make sure the application is running on `localhost` or `https`.
- Open DevTools Console and look for logs such as:
  - `[webrtc]`
  - `Failed to get local media`
  - `Failed to add ICE candidate`
# Excalidraw Clone (Multi‑User, Realtime)

A collaborative whiteboard inspired by **Excalidraw**, built to support **multiple concurrent users** with **realtime sync via WebSockets**, organized as a **Turborepo monorepo**.

This project focuses on correctness, scalability, and clean separation of concerns between frontend, backend, and shared packages.

---

## Features

*  Real‑time collaborative drawing

*  Multiple users editing the same canvas

*  Live sync using WebSockets

* Monorepo architecture with Turborepo

* Shared types and utilities across apps

* Fast local development with incremental builds

---

## Tech Stack

### Frontend

* Next
* TypeScript
* HTML Canvas / SVG
* WebSocket client

### Backend

* Node.js
* TypeScript
* WebSocket server (`ws` or equivalent)
* HTTP server for health/auth (optional)

### Monorepo Tooling

* Turborepo
* pnpm
* Shared ESLint & TypeScript configs

---

## Repository Structure

```
.
├── apps/
│   ├── web/                # Frontend (Next.js)
│   ├── http-backend/       # HTTP server (health, auth, REST)
│   └── ws-backend/         # WebSocket server (realtime sync)
│
├── packages/
│   ├── ui/                 # Shared UI components
│   ├── types/              # Shared TypeScript types
│   ├── eslint-config/      # Shared ESLint config
│   └── tsconfig/           # Shared TS configs
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## How Realtime Collaboration Works

1. Each client connects to the backend via WebSocket.
2. A **room / board ID** identifies a shared canvas.
3. Drawing actions are sent as **events**, not full canvas snapshots.
4. The server broadcasts validated events to all connected clients in the room.
5. Clients apply events deterministically to keep state in sync.

This avoids heavy payloads and keeps latency low.

---

## WebSocket Event Model (Example)

* `join_room`
* `leave_room`
* `draw_start`
* `draw_update`
* `draw_end`
* `clear_canvas`

All events use shared TypeScript types from `packages/types` to guarantee consistency.

---

## Local Development

### Install Dependencies

```bash
pnpm install
```

### Start All Apps

```bash
pnpm dev
```

This runs frontend and backend in parallel using Turborepo.

### Start Individual Apps

```bash
pnpm --filter web dev
pnpm --filter http-backend dev
```

---

## Environment Variables

### Backend (`apps/http-backend/.env`)

```
PORT=3001
WS_PATH=/ws
```

### Frontend (`apps/web/.env`)

```
VITE_WS_URL=ws://localhost:3001/ws
```

---

## Shared Packages

### `@repo/types`

* WebSocket event types
* Drawing primitives
* Room and user models

### `@repo/ui`

* Reusable buttons, inputs, toolbars
* Canvas controls

Using shared packages eliminates frontend/backend drift.

---

## Turborepo Tasks

Defined in `turbo.json`:

* `dev` – run apps in watch mode
* `build` – production builds with caching
* `lint` – shared lint rules
* `typecheck` – strict TypeScript validation

Turborepo ensures only affected packages rebuild.

---

## Future Improvements

* Canvas persistence (Redis / DB)
* User authentication
* Presence indicators (cursors, usernames)
* Undo/redo with operation history
* Access control per board

##

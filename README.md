# Online Chess Platform ♟️

> **Academic Capstone Project in Software Engineering & Computer Science**  
> *Real-Time Client-Server Architecture, Authoritative Chess Rules, and Custom Minimax AI Engine with Alpha-Beta Pruning.*

[![Build & Tests](https://img.shields.io/badge/tests-40%2F40%20passing-brightgreen)](#automated-testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

---

## 1. Project Overview

**Online Chess** is a full-stack, secure, real-time multiplayer chess web application featuring an interactive chessboard, server-authoritative game state validation, authoritative clocks, in-game chat, match replay, FIDE-standard Elo ratings, and a **custom chess AI search engine** written from scratch using the Minimax algorithm with Alpha-Beta pruning.

The user interface is designed with a dark, modern chess aesthetic localized in **Vietnamese**, while technical architectures, codebase identifiers, and academic documentation are maintained in **English**.

---

## 2. Technology Stack

### Frontend (`apps/web`)
- **React 18** with **TypeScript** and **Vite** (fast build & HMR).
- **React Router v6** for client-side routing.
- **Tailwind CSS** with a custom dark chess aesthetic.
- **Zustand** for lightweight authentication and UI state management.
- **Socket.IO Client** for real-time WebSocket communication.
- **TanStack Query** for server-state caching and synchronization.
- **react-chessboard** for the interactive drag-and-drop chessboard.
- **chess.js** (client-side move previews only; never authoritative).
- **React Hook Form** and **Zod** for schema validation.
- **Lucide React** for modern iconography.

### Backend (`apps/server`)
- **Node.js** with **TypeScript** and **Express.js**.
- **Socket.IO** for low-latency bidirectional game events and clock sync.
- **PostgreSQL 16** for relational persistence.
- **Prisma ORM** for database access, schema migrations, and relational integrity.
- **bcryptjs** for salted password hashing.
- **jsonwebtoken (JWT)** for access-token authentication.
- **Pino & pino-pretty** for structured logging.
- **Vitest & Supertest** for automated unit and integration tests.

### Custom Chess AI Engine (`apps/server/src/modules/ai`)
- **Minimax Search** with **Alpha-Beta Pruning**.
- **Dynamic Move Ordering** using MVV-LVA (Most Valuable Victim - Least Valuable Attacker), promotions, and checks.
- **Centipawn Evaluation** based on material balance, Piece-Square Tables (PST), king safety, and doubled pawn penalties.
- **3 Configurable Difficulty Levels**:
  - `EASY`: Depth 1 with 35% safe randomness.
  - `MEDIUM`: Depth 3 with move ordering.
  - `HARD`: Depth 4 with deep evaluation & tactical combination searching.
- Fully custom implementation (no Stockfish dependency).

---

## 3. Monorepo Structure

```
online-chess/
├── apps/
│   ├── web/                     # React 18 + Vite frontend application
│   │   ├── src/
│   │   │   ├── app/             # App shell, Navbar, Routes
│   │   │   ├── features/        # Feature modules: auth, lobby, game, ai, profile, replay, admin
│   │   │   ├── services/        # Axios API client & Socket.IO singleton
│   │   │   └── stores/          # Zustand authentication store
│   │   └── package.json
│   └── server/                  # Node.js + Express + Socket.IO backend
│       ├── prisma/              # Prisma PostgreSQL schema
│       ├── src/
│       │   ├── config/          # Environment variables & Pino logger
│       │   ├── database/        # Prisma client & connection resilience
│       │   ├── middleware/      # JWT auth, error handler, Zod validator
│       │   ├── modules/         # auth, users, rooms, matchmaking, games, chess, ai, ratings, admin
│       │   └── sockets/         # Socket.IO game gateway & handlers
│       ├── tests/               # Vitest test suites (40 passing tests)
│       └── package.json
├── packages/
│   └── shared/                  # Shared TypeScript types, Zod schemas, constants, socket contracts
│       ├── src/
│       │   ├── constants/       # Chess FEN, time controls, ELO configs, AI settings
│       │   ├── schemas/         # Zod schemas for auth, rooms, moves, chat
│       │   └── types/           # User, Game, Move, Room, Socket payloads
│       └── package.json
├── docs/                        # Complete 20+ page academic capstone documentation
│   ├── requirements.md          # Functional & non-functional requirements
│   ├── architecture.md          # System architecture, class & sequence diagrams
│   ├── database-design.md       # PostgreSQL schema, ERD, tables & indexes
│   ├── api-specification.md     # Versioned REST API documentation (/api/v1)
│   ├── socket-events.md         # WebSocket event contracts & payloads
│   ├── chess-engine.md          # Minimax & Alpha-Beta algorithm specification
│   ├── testing.md               # Automated testing report & verification cases
│   ├── deployment.md            # Local & Docker deployment procedures
│   └── use-cases.md             # Use case diagram & formal specifications
├── docker-compose.yml           # PostgreSQL 16 + Server + Web Docker setup
├── .env.example                 # Template for environment configuration
├── package.json                 # Monorepo npm workspaces configuration
└── README.md
```

---

## 4. Quick Start Guide

### Prerequisites
- Node.js $\ge$ 20.x
- npm $\ge$ 10.x

### 1. Installation
Clone the repository and install all workspace dependencies:
```bash
git clone <repository-url>
cd DoAnCoSo4.1
npm install
```

### 2. Generate Database Client & Build Packages
```bash
# Generate Prisma Client
npm run db:generate

# Build all monorepo packages (shared, server, web)
npm run build
```

### 3. Run Automated Tests
Execute the 40 automated test cases:
```bash
npm test
```

### 4. Start Development Servers
Start both backend and frontend servers:
```bash
# Terminal 1: Backend Server (runs on http://localhost:4000)
npm run dev:server

# Terminal 2: Web Client (runs on http://localhost:5173)
npm run dev:web
```
Open **`http://localhost:5173`** in your browser!

---

## 5. Docker Deployment

Deploy the entire platform including PostgreSQL 16 with a single command:
```bash
# Build and run containers in detached mode
docker compose up -d --build

# Run migrations within the server container
docker compose exec server npx prisma migrate deploy
```
- Web Application: `http://localhost:5173`
- Backend API & Healthcheck: `http://localhost:4000/api/v1/health`

---

## 6. Live Demonstration Walkthrough

### Scenario A: Real-Time Human-vs-Human Multiplayer
1. Open two separate browser windows (or an Incognito window):
   - Window 1: Register player `grandmaster_1` (gets 1200 ELO).
   - Window 2: Register player `grandmaster_2` (gets 1200 ELO).
2. In Window 1, navigate to **Sảnh chờ (Lobby)** and click **Tạo Phòng Mới** (e.g., 5 min Blitz).
3. In Window 2, join the room using the 6-character room code or click the public room card.
4. The system pairs both players, assigns colors, and redirects both to `/game/:id`.
5. Play moves (`1. e4 e5`, etc.):
   - Both screens update simultaneously in real time.
   - Server validates turn, prevents illegal moves, updates server clocks, and appends to SAN move history.
   - In-game chat delivers real-time messages.
6. When checkmate occurs or a player resigns:
   - Confetti animation triggers.
   - Result modal shows ELO rating adjustments calculated with the FIDE Elo formula.

### Scenario B: Challenging the Custom Chess AI
1. Navigate to **Đấu với AI** (`/ai`).
2. Select your difficulty level (`Dễ`, `Trung bình`, `Khó`) and preferred color.
3. Click **Bắt Đầu Ván Mới**.
4. Play your move:
   - The AI uses custom Minimax with Alpha-Beta pruning.
   - Live metrics display: search depth, nodes visited, branches pruned, computation duration in milliseconds, and centipawn evaluation score.

### Scenario C: Game Replay & Analysis
1. Navigate to **Lịch sử đấu** (`/history`).
2. Select any completed match.
3. Use the stepper controls (`|<<`, `<`, `>`, `>>`) to step through moves and inspect reconstructed board positions.

### Scenario D: Platform Administration
1. Log in with the pre-seeded administrator credentials (`admin` / `AdminSecurePass123!`).
2. Navigate to **Quản trị viên** (`/admin`).
3. View registered users, inspect active server uptime and memory usage, and toggle user account status (`ACTIVE` / `SUSPENDED`).

---

## 7. Automated Testing Status

The automated test suite runs via Vitest with 100% passing results:
- **`tests/health.test.ts`**: 4/4 passing
- **`tests/auth.test.ts`**: 11/11 passing
- **`tests/chessRules.test.ts`**: 8/8 passing
- **`tests/game.test.ts`**: 7/7 passing
- **`tests/ai.test.ts`**: 6/6 passing
- **`tests/admin.test.ts`**: 4/4 passing

**Total**: `40 passed (40)` across 6 suites in ~5.2 seconds.

---

## 8. Academic Capstone Documentation Index

Comprehensive documentation is provided in the `docs/` directory:
- [Requirements Specification (SRS)](docs/requirements.md)
- [System Architecture & Diagrams](docs/architecture.md)
- [Database Design & ERD](docs/database-design.md)
- [REST API Specification](docs/api-specification.md)
- [Socket.IO Event Contracts](docs/socket-events.md)
- [Chess AI Engine Specification](docs/chess-engine.md)
- [Automated Testing Report](docs/testing.md)
- [Deployment & Operations Guide](docs/deployment.md)
- [Use Case Specifications](docs/use-cases.md)

---

## 9. License & Academic Attribution
Developed as an academic capstone project demonstrating Software Engineering, Multiplayer Game Networking, and Artificial Intelligence concepts.
All rights reserved © 2026.

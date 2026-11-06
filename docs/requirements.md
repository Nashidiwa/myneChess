# Software Requirements Specification (SRS) - Online Chess Platform

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **Online Chess Platform**, an academic capstone web application engineered to demonstrate advanced client-server architecture, authoritative real-time multiplayer networking, a custom chess AI search engine (Minimax with Alpha-Beta pruning), cryptographic authentication, ELO rating dynamics, and relational database persistence.

### 1.2 Scope of the System
The platform serves casual players, competitive chess enthusiasts, and platform administrators. Key capabilities include:
- Account management with secure credential hashing (bcrypt) and short-lived JWT access tokens.
- Server-authoritative chess rules validation preventing illegal moves, race conditions, and client tampering.
- Real-time multiplayer synchronization via WebSocket (Socket.IO) with room management and automated matchmaking.
- Server-authoritative chess clocks with configurable base time and increments.
- A custom, non-Stockfish AI chess engine implementing Minimax search, Alpha-Beta pruning, Piece-Square Tables (PST), move ordering (MVV-LVA), and configurable difficulty levels (Easy, Medium, Hard).
- Complete game history persistence with SAN move notation and move-by-move board reconstruction replay.
- Standard Elo rating calculation updated deterministically upon game conclusion.
- Administrative controls for user moderation and system diagnostic statistics.

---

## 2. Functional Requirements

### 2.1 User Management & Authentication (FR-01 to FR-06)
- **FR-01: User Registration**
  - The system shall allow guests to register an account with a unique username, valid email, and secure password (minimum 6 characters).
  - Passwords must be hashed using bcrypt (cost factor = 10) prior to storage.
- **FR-02: User Authentication**
  - Registered users shall authenticate using either username or email along with their password.
  - On successful login, the server shall issue a signed JSON Web Token (JWT) encapsulating `userId`, `username`, and `role`.
- **FR-03: Profile Retrieval & Modification**
  - Authenticated users can retrieve their current profile, ELO rating, and match statistics.
  - Users can update their email and change their password by confirming their current password.
- **FR-04: Role-Based Access Control (RBAC)**
  - The system shall distinguish between `GUEST`, `PLAYER`, and `ADMIN` actors.
  - Administrative routes (`/api/v1/admin/*`) must reject unprivileged users with HTTP 403 Forbidden.
- **FR-05: Account Moderation**
  - Administrators shall have the authority to inspect user accounts and toggle their account status between `ACTIVE`, `RESTRICTED`, and `SUSPENDED`.
  - Suspended accounts must be rejected at login.

### 2.2 Lobby & Matchmaking (FR-07 to FR-12)
- **FR-07: Public Room Browsing**
  - The lobby shall list active public rooms displaying room code, host username, ELO rating, time controls, and occupancy.
- **FR-08: Room Creation**
  - Players can create public or private rooms with customizable time controls (1m, 3m, 5m, 10m, 15|10) and piece color preference.
  - Private rooms must generate a collision-resistant 6-character alphanumeric code.
- **FR-09: Direct Room Joining**
  - Players can join an available room either by clicking a public room card or submitting a private room code.
- **FR-10: Automated Matchmaking Queue**
  - Players can enter an automated queue matching compatible time controls.
  - Once paired, the server shall automatically create the room and game, assign colors, and emit a `MATCH_FOUND` event.
- **FR-11: Matchmaking Cancellation**
  - A queued player can cancel matchmaking at any time prior to pair formation.

### 2.3 Authoritative Chess Rules & Game Engine (FR-13 to FR-20)
- **FR-13: Server-Authoritative State**
  - The server is the sole arbiter of game state, legal moves, clocks, and game outcome. Client-supplied positions or clock times are strictly rejected.
- **FR-14: Concurrency & Stale Move Rejection**
  - Every move submission must include the expected `positionVersion`. Moves based on stale versions are rejected with HTTP 409 Conflict.
- **FR-15: Complete Rules Adherence**
  - The rules engine encapsulates standard FIDE rules: piece movement, en passant, castling (kingside and queenside), pawn promotion (queen, rook, bishop, knight), check detection, checkmate, stalemate, insufficient material, threefold repetition, and fifty-move rule.
- **FR-16: Server-Side Authoritative Clock**
  - Clocks run strictly based on server elapsed timestamps. Increments are credited to the moving player after successful server validation.
- **FR-17: Timeout Detection**
  - When a player's clock reaches zero, the server terminates the game and awards victory to the opponent by `TIMEOUT`.
- **FR-18: Resignation & Draw Negotiation**
  - A player may resign at any time, terminating the game in favor of the opponent.
  - A player may offer a draw. The opponent can accept or reject the offer.
- **FR-19: In-Game Scoped Chat**
  - Participants can exchange sanitized text messages scoped strictly to the active game room.
- **FR-20: Reconnection & Recovery**
  - A disconnected player reconnecting with a valid JWT shall receive the full authoritative game state, clock values, and chat history.

### 2.4 Custom AI Engine (FR-21 to FR-25)
- **FR-21: Algorithmic Implementation**
  - The AI must use custom Minimax search with Alpha-Beta pruning rather than external engine APIs.
- **FR-22: Heuristic Evaluation Function**
  - Position evaluation must incorporate piece material values, Piece-Square Tables (PST), king safety, and pawn structure penalties (e.g. doubled pawns).
- **FR-23: Move Ordering**
  - Moves must be ordered dynamically (captures via MVV-LVA, promotions, and checks) to maximize Alpha-Beta cutoffs.
- **FR-24: Configurable Difficulty Levels**
  - Easy: Depth 1 search with a controlled randomness factor.
  - Medium: Depth 3 search with move ordering.
  - Hard: Depth 4 search with full positional evaluation.
- **FR-25: Search Metrics**
  - The AI engine records and exposes search depth, nodes visited, nodes pruned, calculation duration, and evaluation score.

### 2.5 ELO Rating & History Replay (FR-26 to FR-30)
- **FR-26: Elo Rating Updates**
  - Competitive PvP games update both players' ELO ratings using standard logistic curves ($K=32$ for ratings $<2400$, $K=16$ for ratings $\ge 2400$).
- **FR-27: Non-Rated AI Matches**
  - Games against the AI engine do not alter competitive PvP ELO ratings.
- **FR-28: Global Leaderboard**
  - The platform exposes a paginated leaderboard ranked by current ELO rating.
- **FR-29: Replay Stepper**
  - Completed games can be inspected step-by-step with First, Previous, Next, and Last controls, reconstructing each intermediate board from stored moves.

---

## 3. Non-Functional Requirements

### 3.1 Security Requirements
- **NFR-01: Cryptographic Authentication**: Passwords hashed with bcrypt; access tokens signed with HMAC-SHA256 (min. 32-character secret).
- **NFR-02: Injection Protection**: All relational database queries use Prisma ORM parameterized queries.
- **NFR-03: Payload Validation**: All REST inputs and Socket.IO messages are validated with Zod schemas.
- **NFR-04: Security Headers**: Helmet middleware enforces HTTP security headers (XSS filter, frameguard, noSniff).

### 3.2 Performance & Scalability
- **NFR-05: Real-Time Latency**: Socket.IO move validation and broadcast under 50ms under normal network conditions.
- **NFR-06: AI Response Time**: Search execution bounded by time limits (Easy $<1$s, Medium $<2.5$s, Hard $<5$s).
- **NFR-07: Resilient Store**: Graceful degradation to in-memory repository store if PostgreSQL is unavailable.

### 3.3 Usability & Localization
- **NFR-08: Vietnamese User Interface**: All client-facing UI labels, modals, and notifications in natural Vietnamese.
- **NFR-09: Responsive Design**: Fully responsive layout optimized for desktop and mobile viewports with Tailwind CSS.

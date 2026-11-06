# Use Case Specifications - Online Chess Platform

## 1. Actor Hierarchy & Use Case Diagram

The platform defines three distinct actors:
- **Guest**: Unauthenticated visitor browsing the platform, viewing the leaderboard, or playing casually against the AI.
- **Player (Registered)**: Authenticated user capable of hosting rooms, joining ranked matchmaking, participating in rated matches, chatting, and viewing match history.
- **Administrator**: Privileged user authorized to manage user statuses, restrict abusive accounts, and inspect server metrics.

```mermaid
flowchart LR
    Guest((Guest))
    Player((Player))
    Admin((Administrator))

    Guest --- UC01["UC-01: Register Account"]
    Guest --- UC02["UC-02: Login to Platform"]
    Guest --- UC03["UC-03: Play against AI"]
    Guest --- UC04["UC-04: View Global Leaderboard"]

    Player --- UC05["UC-05: Create / Join Room"]
    Player --- UC06["UC-06: Quick Matchmaking"]
    Player --- UC07["UC-07: Play Real-Time Chess Match"]
    Player --- UC08["UC-08: Replay Completed Match"]
    Player --- UC09["UC-09: Update Profile & Credentials"]

    Admin --- UC10["UC-10: Suspend Abusive User Account"]
    Admin --- UC11["UC-11: Inspect System Metrics"]

    Guest <|-- Player
    Player <|-- Admin
```

---

## 2. Detailed Use Case Specifications

### UC-05: Create & Join Room
- **Primary Actor**: Player
- **Preconditions**: User is authenticated with a valid JWT token.
- **Main Success Scenario**:
  1. Player navigates to the Sảnh chờ (Lobby).
  2. Player clicks "Tạo Phòng Mới" and chooses a time control (e.g. 5 phút Blitz), visibility (`PUBLIC` or `PRIVATE`), and preferred color.
  3. Server allocates a unique 6-character room code (e.g. `K9X2B7`) and creates the room in `WAITING` status.
  4. Opponent browses the public list or inputs the room code and clicks "Tham Gia".
  5. Server pairs both players, assigns White and Black colors, creates the `Game` instance in `IN_PROGRESS`, and transitions the room to `READY`.
  6. Both players are automatically redirected to the game arena (`/game/:id`).
- **Alternative Flow**:
  - Room is already full $\to$ Server returns 400 Bad Request ("Phòng chơi đã đủ 2 người").

### UC-07: Play Real-Time Authoritative Chess Match
- **Primary Actor**: Player
- **Preconditions**: Both players are connected to `/game/:id` via WebSocket.
- **Main Success Scenario**:
  1. White player drags a piece to a destination square on the interactive chessboard.
  2. Frontend sends `MOVE` event with `{ gameId, from, to, promotion, expectedVersion }`.
  3. Server validates user turn, checks that clock has remaining time, and verifies move legality via `ChessRulesService`.
  4. Server applies move, updates FEN, increments `positionVersion`, credits clock increment, and saves `Move` to database.
  5. Server broadcasts `MOVE_RESULT` to channel `game:{id}`. Both players' boards update synchronously.
  6. Sequence repeats until a game-ending condition (Checkmate, Stalemate, Timeout, Resignation, Draw) occurs.
  7. Server computes FIDE ELO adjustments, saves `RatingHistory`, and emits `GAME_OVER`.
- **Alternative Flow**:
  - Player attempts illegal move $\to$ Server rejects move; frontend reverts piece to previous square.
  - Player disconnects $\to$ Reconnects with JWT; server restores authoritative state and clocks.

### UC-10: Suspend Abusive User Account
- **Primary Actor**: Administrator
- **Preconditions**: Administrator is logged in (`role === 'ADMIN'`).
- **Main Success Scenario**:
  1. Administrator visits `/admin`.
  2. Administrator filters or searches for an account exhibiting abusive behavior.
  3. Administrator clicks "Khóa tài khoản" (`PATCH /api/v1/admin/users/:id/status` with `status: 'SUSPENDED'`).
  4. Server updates `accountStatus` in database.
  5. Target user's subsequent login attempts are rejected with HTTP 403 Forbidden.

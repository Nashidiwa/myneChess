# Socket.IO Real-Time Event Contracts

## 1. Socket Authentication & Scoping Strategy

Socket connections authenticate during the handshake via either `auth: { token: "<jwt>" }` or `headers: { authorization: "Bearer <jwt>" }`.
- If a valid token is presented, `socket.data.user = { userId, username, role }`.
- Broadcast channels are strictly partitioned:
  - `room:{roomId}`: Scoped for room lobby updates, player readiness, and game initiation.
  - `game:{gameId}`: Scoped strictly to game moves, clock synchronizations, draw offers, and chat messages.

---

## 2. Client-to-Server Events

| Event Name | Payload Schema | Auth Required | Description & Side Effects |
| :--- | :--- | :---: | :--- |
| `JOIN_ROOM` | `{ roomId?: string, roomCode?: string, colorPreference?: string }` | Yes | Joins a room, assigns socket to channel `room:{id}`, starts game if 2 players present. Emits `ROOM_UPDATED`. |
| `LEAVE_ROOM` | `{ roomId: string }` | Yes | Removes user from room, releases slot, emits `ROOM_UPDATED` or deletes empty room. |
| `REQUEST_GAME_STATE` | `{ gameId: string }` | No | Subscribes socket to `game:{id}`, emits authoritative `GAME_STATE` and full chat history. |
| `MOVE` | `{ gameId: string, from: string, to: string, promotion?: string, expectedVersion: number }` | Optional/Participant | Server verifies turn, clock, and version; applies move via rules service; broadcasts `MOVE_RESULT` and `GAME_OVER` if terminal. |
| `CHAT` | `{ gameId: string, message: string }` | Yes | Sanitizes message (max 500 chars), persists to database, broadcasts `CHAT_MESSAGE` to `game:{id}`. |
| `RESIGN` | `{ gameId: string }` | Yes | Awards victory to opponent by `RESIGNATION`, calculates ELO changes, broadcasts `GAME_OVER`. |
| `DRAW_OFFER` | `{ gameId: string }` | Yes | Sets `drawOfferedBy`, emits `DRAW_OFFERED` to opponent in `game:{id}`. |
| `DRAW_ACCEPT` | `{ gameId: string }` | Yes | Verifies pending offer, terminates game as `DRAW` (`MUTUAL_AGREEMENT`), updates ELO, emits `GAME_OVER`. |
| `DRAW_REJECT` | `{ gameId: string }` | Yes | Clears pending offer, emits `DRAW_REJECTED` to opponent. |
| `RECONNECT` | `{ gameId: string }` | Yes | Re-joins socket to `game:{id}`, resynchronizes latest `GAME_STATE` and alerts opponent via `PLAYER_RECONNECTED`. |
| `MATCHMAKING_JOIN` | `{ initialTimeMs: number, incrementMs: number }` | Yes | Enqueues player; if partner found, creates room + game and emits `MATCH_FOUND`. |
| `MATCHMAKING_CANCEL`| `void` | Yes | Dequeues user from matchmaking. |

---

## 3. Server-to-Client Events

| Event Name | Payload Schema | Trigger Condition |
| :--- | :--- | :--- |
| `ROOM_UPDATED` | `RoomData` | Emitted when players join, leave, or room state shifts (`WAITING` $\to$ `READY` $\to$ `IN_PROGRESS`). |
| `MATCH_FOUND` | `{ gameId: string, gameState: GameState }` | Emitted to both matched players upon pairing. |
| `MOVE_RESULT` | `MoveResultPayload` | Emitted to channel `game:{id}` after server accepts and commits a validated move. |
| `CLOCK_UPDATE` | `{ gameId: string, whiteRemainingMs: number, blackRemainingMs: number, activeColor: string }` | Emitted periodically by authoritative server clock timer. |
| `GAME_OVER` | `GameOverPayload` | Emitted on checkmate, stalemate, timeout, resignation, or mutual draw agreement. Includes ELO rating deltas. |
| `CHAT_MESSAGE` | `ChatMessage` | Emitted to `game:{id}` when a participant sends a message. |
| `DRAW_OFFERED` | `{ gameId: string, offeredBy: string }` | Emitted to opponent when a draw offer is tendered. |
| `DRAW_REJECTED` | `{ gameId: string, rejectedBy: string }` | Emitted to offerer when a draw is declined. |
| `PLAYER_RECONNECTED`| `{ userId: string, username: string }` | Emitted when a disconnected player reconnects. |
| `ERROR` | `{ code: string, message: string }` | Emitted to socket when a command fails validation or authorization. |

# RESTful API Specification - Online Chess Platform

**Base URL**: `http://localhost:4000/api/v1`  
**Authentication Scheme**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "grandmaster_alex",
    "email": "alex@chess.org",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `201 Created`: User successfully created. Returns JWT access token and user profile.
  - `400 Bad Request`: Validation failure (duplicate username, invalid email format, short password).

### 1.2 Login User
- **Method**: `POST`
- **Path**: `/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "usernameOrEmail": "grandmaster_alex",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: Successful authentication. Returns `{ accessToken, user: { id, username, email, eloRating, role } }`.
  - `401 Unauthorized`: Invalid username/email or password mismatch.
  - `403 Forbidden`: Account is currently `SUSPENDED`.

### 1.3 Logout User
- **Method**: `POST`
- **Path**: `/auth/logout`
- **Auth Required**: No
- **Responses**:
  - `200 OK`: Session cleared.

### 1.4 Get Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Responses**:
  - `200 OK`: Returns current user profile.
  - `401 Unauthorized`: Missing or invalid token.

---

## 2. User & Profile Endpoints

### 2.1 Get Profile
- **Method**: `GET`
- **Path**: `/users/me`
- **Auth Required**: Yes

### 2.2 Update Profile
- **Method**: `PATCH`
- **Path**: `/users/me`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "email": "alex_new@chess.org",
    "currentPassword": "SecurePassword123!",
    "newPassword": "NewStrongPassword456!"
  }
  ```

### 2.3 Get User Statistics
- **Method**: `GET`
- **Path**: `/users/:id/stats`
- **Auth Required**: Optional

---

## 3. Room & Matchmaking Endpoints

### 3.1 List Public Rooms
- **Method**: `GET`
- **Path**: `/rooms`
- **Auth Required**: No
- **Responses**:
  - `200 OK`: Array of waiting public rooms.

### 3.2 Create Room
- **Method**: `POST`
- **Path**: `/rooms`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Alex's Blitz Arena",
    "visibility": "PUBLIC",
    "initialTimeMs": 300000,
    "incrementMs": 0,
    "colorPreference": "random"
  }
  ```

### 3.3 Join Room
- **Method**: `POST`
- **Path**: `/rooms/:id/join`
- **Auth Required**: Yes
- **Responses**:
  - `200 OK`: Returns `{ room, gameId }`.

---

## 4. Game Endpoints

### 4.1 Get Game State
- **Method**: `GET`
- **Path**: `/games/:id`
- **Auth Required**: Optional

### 4.2 Get Move List
- **Method**: `GET`
- **Path**: `/games/:id/moves`

### 4.3 Get Game Replay
- **Method**: `GET`
- **Path**: `/games/:id/replay`
- **Responses**:
  - `200 OK`: Returns `{ game: GameState, history: Array<{ ply, san, from, to, fen }> }`

### 4.4 Get My Match History
- **Method**: `GET`
- **Path**: `/games/history/me?page=1&limit=10`
- **Auth Required**: Yes

### 4.5 Make Move
- **Method**: `POST`
- **Path**: `/games/:id/move`
- **Auth Required**: Optional / Sockets preferred
- **Request Body**:
  ```json
  {
    "from": "e2",
    "to": "e4",
    "promotion": "q",
    "expectedVersion": 0
  }
  ```
- **Responses**:
  - `200 OK`: Move validated and applied. Returns updated FEN, turn, clock values.
  - `400 Bad Request`: Illegal move according to rules engine.
  - `403 Forbidden`: Moving out of turn or non-participant.
  - `409 Conflict`: Stale move rejected (`expectedVersion` mismatch).

### 4.6 Resign Game
- **Method**: `POST`
- **Path**: `/games/:id/resign`
- **Auth Required**: Yes

### 4.7 Draw Negotiation
- **Method**: `POST`
- **Path**: `/games/:id/draw-offer` and `/games/:id/draw-accept`
- **Auth Required**: Yes

---

## 5. Custom AI Endpoints

### 5.1 Create AI Game
- **Method**: `POST`
- **Path**: `/ai/game`
- **Auth Required**: Optional
- **Request Body**:
  ```json
  {
    "difficulty": "HARD",
    "initialTimeMs": 600000,
    "incrementMs": 0,
    "playerColor": "white"
  }
  ```

### 5.2 Trigger AI Move
- **Method**: `POST`
- **Path**: `/ai/move`
- **Auth Required**: Optional
- **Request Body**:
  ```json
  {
    "gameId": "uuid-v4-string"
  }
  ```
- **Responses**:
  - `200 OK`: Returns chosen move, updated FEN, and search statistics (`depth`, `nodesVisited`, `nodesPruned`, `durationMs`, `score`).

---

## 6. Leaderboard & Administration

### 6.1 Get Global Leaderboard
- **Method**: `GET`
- **Path**: `/leaderboard?page=1&limit=20`

### 6.2 Admin User Management
- **Method**: `GET` `/admin/users?page=1&limit=20&search=keyword`
- **Method**: `PATCH` `/admin/users/:id/status` (`{ "status": "SUSPENDED" }`)
- **Method**: `GET` `/admin/stats` (Server uptime, memory, total users)
- **Auth Required**: Yes (`role: ADMIN`)

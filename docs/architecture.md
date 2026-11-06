# System Architecture Document - Online Chess Platform

## 1. Architectural Overview

The Online Chess Platform is architected as a modular monorepo adhering to clean Client-Server separation and Domain-Driven Design (DDD) principles. The architecture partitions responsibilities across three discrete layers:
1. **Frontend Application (`apps/web`)**: A single-page application built on React 18, Vite, React Router, Tailwind CSS, TanStack Query, and Zustand, rendering Vietnamese-localized UI components.
2. **Backend Server (`apps/server`)**: A Node.js and Express RESTful service coupled with an authenticated Socket.IO WebSocket server, structured into modular feature services (Auth, Users, Rooms, Games, Chess, AI, Ratings, Admin).
3. **Shared Contract Library (`packages/shared`)**: Shared TypeScript types, Zod schemas, constants, and Socket.IO event definitions consumed by both client and server to guarantee type safety and schema consistency.

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite)"]
        UI["UI Pages & Tailwind CSS (VN)"]
        Board["Interactive Chessboard (react-chessboard)"]
        ZStore["Zustand State Store (Auth & UI)"]
        RQ["TanStack Query (REST Cache)"]
        WSClient["Socket.IO Client (Real-time Events)"]
        UI --> Board
        UI --> ZStore
        UI --> RQ
        UI --> WSClient
    end

    subgraph Network["Network & Security Layer"]
        HTTP["HTTP / REST API (Port 4000)"]
        WSS["WebSocket / Socket.IO (Port 4000)"]
        JWTAuth["JWT Bearer Authentication"]
        ZodVal["Zod Schema Validation Middleware"]
    end

    subgraph Server["Backend Application (Express + Node.js)"]
        App["Express App & Middleware (Helmet, CORS, Pino)"]
        AuthMod["Auth & User Module (bcrypt)"]
        RoomMod["Room & Matchmaking Module"]
        GameMod["Authoritative Game Service"]
        ChessRules["ChessRulesService (chess.js encapsulation)"]
        AIMod["Custom AI Engine (Minimax + Alpha-Beta)"]
        RatingMod["RatingsService (FIDE Elo Formula)"]
        AdminMod["Admin Module"]

        App --> AuthMod
        App --> RoomMod
        App --> GameMod
        GameMod --> ChessRules
        GameMod --> AIMod
        GameMod --> RatingMod
        App --> AdminMod
    end

    subgraph Persistence["Persistence & Database Layer"]
        PrismaORM["Prisma ORM Client"]
        PostgresDB[("PostgreSQL 16 Database")]
        MemStore["Resilient In-Memory Fallback Store"]

        AuthMod --> PrismaORM
        GameMod --> PrismaORM
        AdminMod --> PrismaORM
        PrismaORM --> PostgresDB
        PrismaORM -.-> MemStore
    end

    WSClient <-->|Real-time Moves, Clocks, Chat| WSS
    RQ <-->|REST Requests & Mutates| HTTP
    HTTP --> JWTAuth --> ZodVal --> App
    WSS --> JWTAuth --> GameMod
```

---

## 2. Sequence Diagram: Authoritative Chess Move Lifecycle

The sequence below illustrates the strict server-authoritative move validation workflow, ensuring that no client can unilaterally alter the board, clock, or game outcome.

```mermaid
sequenceDiagram
    autonumber
    actor PlayerA as White Player (Client)
    participant SocketA as Socket Client A
    participant Server as Socket.IO Server & GameService
    participant Rules as ChessRulesService
    participant Ratings as RatingsService
    participant DB as GameRepository / Prisma
    actor PlayerB as Black Player (Client)

    PlayerA->>SocketA: Drags piece e2 -> e4
    SocketA->>Server: emit("MOVE", { gameId, from: "e2", to: "e4", expectedVersion: 0 })

    Server->>Server: Authenticate Socket Token & Verify User is White
    Server->>Server: Check Position Version (expectedVersion == game.positionVersion)
    Server->>Server: Calculate elapsed time on server clock & apply increment

    Server->>Rules: applyMove(currentFen, "e2", "e4", undefined)
    Rules-->>Server: Return { isValid: true, fenAfter, san: "e4", isCheck: false, isGameOver: false }

    Server->>DB: addMove({ ply: 1, moveNumber: 1, san: "e4", fenAfter, ... })
    Server->>DB: updateGame({ positionVersion: 1, currentTurn: "b", currentFen, ... })

    Server-->>SocketA: emit("MOVE_RESULT", { move, fen, currentTurn: "b", version: 1, clocks })
    Server-->>PlayerB: emit("MOVE_RESULT", { move, fen, currentTurn: "b", version: 1, clocks })

    Note over Server,PlayerB: If move results in Checkmate / Stalemate:
    opt isGameOver == true
        Server->>Ratings: applyGameRatingChanges(gameId, whiteId, blackId, result)
        Ratings-->>Server: Return updated ELO ratings
        Server-->>SocketA: emit("GAME_OVER", { result, reason, eloChanges })
        Server-->>PlayerB: emit("GAME_OVER", { result, reason, eloChanges })
    end
```

---

## 3. High-Level Class & Interface Diagram

```mermaid
classDiagram
    class IChessRulesService {
        <<interface>>
        +validateFen(fen: string): boolean
        +isValidMove(fen: string, from: string, to: string, promotion?: string): boolean
        +applyMove(fen: string, from: string, to: string, promotion?: string): MoveValidationResult
        +getLegalMoves(fen: string, square?: string): Move[]
        +isGameOver(fen: string): boolean
        +getGameStatus(fen: string): GameStatusResult
    }

    class ChessRulesService {
        +applyMove(...)
        +getGameStatus(...)
    }

    class IChessAI {
        <<interface>>
        +chooseMove(fen: string, difficulty?: AIDifficulty): Promise~AIChessMove~
        +evaluatePosition(chess: Chess): number
        +search(chess, depth, alpha, beta, isMaximizing, ply): number
        +orderMoves(chess, moves): Move[]
        +getSearchStatistics(): AISearchStats
    }

    class CustomChessAI {
        -stats: AISearchStats
        -timeLimitMs: number
        +evaluatePosition(chess: Chess): number
        +orderMoves(chess: Chess, moves: Move[]): Move[]
        +search(...): number
        +chooseMove(...): Promise~AIChessMove~
    }

    class IGameRepository {
        <<interface>>
        +create(data): Promise~GameRecord~
        +findById(id: string): Promise~GameRecord~
        +update(id: string, data): Promise~GameRecord~
        +addMove(move): Promise~MoveData~
        +getMovesByGameId(gameId): Promise~MoveData[]~
        +getUserGames(userId, skip, take): Promise~GameRecord[]~
    }

    class GameService {
        -gameRepo: IGameRepository
        +createGame(data): Promise~GameRecord~
        +getGameState(gameId): Promise~GameState~
        +makeMove(params): Promise~MoveResult~
        +resign(gameId, playerId)
        +offerDraw(gameId, playerId)
        +acceptDraw(gameId, playerId)
        +getReplay(gameId)
    }

    IChessRulesService <|.. ChessRulesService
    IChessAI <|.. CustomChessAI
    GameService --> IChessRulesService
    GameService --> IGameRepository
    GameService --> CustomChessAI
```

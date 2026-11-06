📋 Phân Tích Dự Án Online Chess Platform

NOTE

Tài liệu phân tích toàn diện cấu trúc, công nghệ, thiết kế hệ thống và cách hoạt động của dự án Online Chess — nền tảng chơi cờ vua trực tuyến thời gian thực với AI đối thủ tùy chỉnh.

📑 Mục Lục
Tổng Quan Dự Án
Kiến Trúc Tổng Thể
Công Nghệ Sử Dụng
Cấu Trúc Monorepo
Backend Server
Frontend Web App
Shared Package
Cơ Sở Dữ Liệu
Hệ Thống Real-time (WebSocket)
Chess Engine & AI
Xác Thực & Bảo Mật
Hạ Tầng & Deployment
Luồng Hoạt Động Chính
Sơ Đồ Kiến Trúc

1. Tổng Quan Dự Án
   Thuộc tính Chi tiết
   Tên dự án online-chess
   Phiên bản 1.0.0
   Mô tả Online Chess Platform with Real-time Multiplayer and Custom Minimax AI
   Kiến trúc Monorepo (npm workspaces)
   Ngôn ngữ TypeScript (full-stack)
   Tính Năng Chính
   ♟️ Multiplayer thời gian thực — Chơi cờ vua online qua Socket.IO
   🤖 AI đối thủ — Thuật toán Minimax tùy chỉnh với 5 cấp độ khó
   📊 Hệ thống ELO — Xếp hạng người chơi theo rating chuẩn
   ⏱️ Chế độ chơi — Bullet (1'), Blitz (3'+2"), Rapid (10'+5"), Classical (30'+10")
   💬 Chat trực tiếp — Nhắn tin trong trận đấu
   🔍 Matchmaking — Ghép cặp tự động theo rating
   📜 Lịch sử trận đấu — Xem lại và phát lại ván cờ
   🏆 Bảng xếp hạng — Leaderboard theo ELO
2. Kiến Trúc Tổng Thể
3. Công Nghệ Sử Dụng
   3.1 Frontend
   Công nghệ Phiên bản Vai trò
   React 18.3 UI framework chính
   TypeScript 5.4 Type safety toàn bộ codebase
   Vite Latest Build tool + dev server (HMR nhanh)
   TailwindCSS 3.4 Utility-first CSS framework
   Zustand 4.5 Lightweight state management
   React Router 6.23 Client-side routing
   Socket.IO Client 4.7 WebSocket real-time
   Axios 1.7 HTTP client với JWT interceptor
   Framer Motion 11.2 Animation (di chuyển quân cờ)
   Lucide React 0.378 Icon library
   React Hot Toast 2.4 Toast notifications
   clsx + tailwind-merge — Conditional className utility
   3.2 Backend
   Công nghệ Phiên bản Vai trò
   Node.js — Runtime environment
   Express 4.19 REST API framework
   Socket.IO 4.7 WebSocket server
   Prisma 5.14 PostgreSQL ORM
   PostgreSQL 16 Database chính (users, games)
   Redis 7 Cache game state, session, matchmaking queue
   ioredis 5.4 Redis client
   Passport.js 0.7 Authentication framework
   passport-jwt 4.0 JWT strategy
   passport-local 1.0 Username/password strategy
   passport-google-oauth20 2.0 Google OAuth strategy
   bcryptjs 2.4 Mã hóa password
   jsonwebtoken 9.0 JWT token generation/verify
   Helmet 7.1 Security headers
   CORS 2.8 Cross-origin config
   express-rate-limit 7.2 Rate limiting
   Morgan 1.10 HTTP request logging
   Zod 3.23 Runtime input validation
   uuid 9.0 Unique ID generation
   3.3 DevOps & Tooling
   Công nghệ Vai trò
   Docker Compose Container orchestration (PostgreSQL + Redis)
   npm Workspaces Monorepo package management
   tsx TypeScript execution (dev mode)
   Vitest Unit testing framework
   ESLint Code linting
   PostCSS + Autoprefixer CSS post-processing
4. Cấu Trúc Monorepo
   online-chess/
   ├── 📄 package.json # Root — npm workspaces config
   ├── 📄 tsconfig.base.json # TypeScript base config (ES2022, strict)
   ├── 📄 docker-compose.yml # PostgreSQL + Redis containers
   ├── 📄 .env.example # Environment variables template
   ├── 📄 .gitignore
   ├── 📄 .dockerignore
   ├── 📄 README.md
   │
   ├── 📁 apps/
   │ ├── 📁 server/ # Backend Express + Socket.IO
   │ │ ├── 📄 package.json
   │ │ ├── 📄 tsconfig.json
   │ │ ├── 📁 prisma/
   │ │ │ └── 📄 schema.prisma
   │ │ └── 📁 src/
   │ │ ├── 📄 server.ts # Entry point
   │ │ ├── 📄 app.ts # Express app setup
   │ │ ├── 📁 config/ # DB, Redis, Passport, CORS
   │ │ ├── 📁 middleware/ # Auth, Error, Rate limit, Validation
   │ │ ├── 📁 routes/ # API route definitions
   │ │ ├── 📁 controllers/ # Request handlers
   │ │ ├── 📁 services/ # Business logic
   │ │ ├── 📁 socket/ # Socket.IO event handlers
   │ │ ├── 📁 game/ # Chess Engine + AI
   │ │ ├── 📁 utils/ # Logger, errors, helpers
   │ │ └── 📁 types/ # Express type augmentation
   │ │
   │ └── 📁 web/ # Frontend React + Vite
   │ ├── 📄 package.json
   │ ├── 📄 vite.config.ts
   │ ├── 📄 tailwind.config.ts
   │ ├── 📄 index.html
   │ └── 📁 src/
   │ ├── 📄 main.tsx # React entry point
   │ ├── 📄 App.tsx # Router + Layout
   │ ├── 📁 api/ # Axios client
   │ ├── 📁 components/ # UI components
   │ │ ├── 📁 game/ # Chess board, pieces, timer
   │ │ ├── 📁 lobby/ # Game list, matchmaking
   │ │ ├── 📁 ui/ # Reusable UI components
   │ │ ├── 📁 auth/ # Login, register forms
   │ │ └── 📁 layout/ # Header, footer, sidebar
   │ ├── 📁 pages/ # Route page components
   │ ├── 📁 stores/ # Zustand state stores
   │ ├── 📁 hooks/ # Custom React hooks
   │ ├── 📁 services/ # API + Socket services
   │ └── 📁 utils/ # Helpers, formatters
   │
   ├── 📁 packages/
   │ └── 📁 shared/ # Shared types & constants
   │ ├── 📄 package.json # @online-chess/shared
   │ └── 📁 src/
   │ ├── 📄 index.ts # Barrel export
   │ ├── 📁 types/ # Game, Socket, User types
   │ └── 📁 constants/ # Game rules, socket events
   │
   ├── 📁 .agents/skills/ # AI agent design skills
   └── 📁 docs/ # Documentation
5. Backend Server
   5.1 Middleware Stack (thứ tự xử lý)
   5.2 API Endpoints
   🔐 Authentication (/api/auth)
   Method Endpoint Mô tả Auth
   POST /register Đăng ký (username, email, password) ❌
   POST /login Đăng nhập → JWT token ❌
   GET /google Bắt đầu Google OAuth ❌
   GET /google/callback Google OAuth callback ❌
   GET /me Lấy profile người dùng hiện tại ✅ JWT
   POST /logout Đăng xuất / hủy token ✅ JWT
   ♟️ Games (/api/games)
   Method Endpoint Mô tả Auth
   GET / Danh sách games (filter: status, mode) ❌
   GET /:id Chi tiết game ❌
   GET /:id/moves Lịch sử nước đi ❌
   POST / Tạo game mới ✅ JWT
   GET /history Lịch sử game của user ✅ JWT
   👤 Users (/api/users)
   Method Endpoint Mô tả Auth
   GET /profile/:id Profile công khai ❌
   PUT /profile Cập nhật profile ✅ JWT
   GET /stats/:id Thống kê người chơi ❌
   GET /search Tìm user theo username ❌
   🏆 Leaderboard (/api/leaderboard)
   Method Endpoint Mô tả Auth
   GET / Top players theo ELO (phân trang) ❌
   GET /mode/:mode Leaderboard theo chế độ chơi ❌
   5.3 Kiến Trúc Server Code

Mô hình phân lớp:

Routes → Định nghĩa endpoint, gắn middleware
Controllers → Xử lý request/response, gọi services
Services → Business logic, tương tác database
Config → Singleton instances (Prisma, Redis, Passport) 6. Frontend Web App
6.1 Routing & Pages
Route Component Auth Mô tả
/ HomePage ❌ Landing page
/login LoginPage ❌ Đăng nhập
/register RegisterPage ❌ Đăng ký
/lobby LobbyPage ✅ Sảnh chờ, danh sách game
/game/:gameId GamePage ✅ Trận đấu đang diễn ra
/play-ai PlayAIPage ✅ Chơi với AI
/profile/:userId ProfilePage ❌ Hồ sơ người chơi
/leaderboard LeaderboardPage ❌ Bảng xếp hạng
/history HistoryPage ✅ Lịch sử trận đấu
6.2 Component Architecture
6.3 State Management (Zustand)

3 stores tách biệt, gọn nhẹ:

authStore — Quản lý xác thực
State: user, token, isAuthenticated, isLoading
Actions: login(), register(), logout(), loadUser()
gameStore — Quản lý trạng thái game
State: currentGame, selectedSquare, validMoves, isFlipped, moveHistory
Actions: setGame(), selectSquare(), makeMove(), flipBoard(), resetGame()
lobbyStore — Quản lý lobby
State: availableGames, onlineCount, isMatchmaking
Actions: setGames(), setOnlineCount(), startMatchmaking(), stopMatchmaking()
6.4 Chess Board Rendering
Grid 8×8: Mỗi ô là component Square chứa ChessPiece
Tương tác: Click để chọn quân → hiển thị nước đi hợp lệ → click đích đến
Drag & Drop: Kéo thả quân cờ bằng mouse events
Highlight: Ô được chọn, nước đi hợp lệ (chấm/vòng), nước đi cuối, ô chiếu
Animation: framer-motion với pieceMove 200ms ease-out
Xoay bàn cờ: Đảo bàn cờ cho người chơi quân đen
Phong tốt: Modal chọn quân khi tốt tới hàng cuối
6.5 Custom Tailwind Theme
Board Colors:
├── board-light: #F0D9B5 (ô sáng)
├── board-dark: #B58863 (ô tối)
├── board-light-highlight: #F7EC6B (ô sáng được chọn)
├── board-dark-highlight: #DAC34B (ô tối được chọn)
├── board-light-move: #CBE990 (nước đi hợp lệ - sáng)
├── board-dark-move: #A8C256 (nước đi hợp lệ - tối)
├── board-light-check: #FF6B6B (chiếu - sáng)
└── board-dark-check: #E53E3E (chiếu - tối)
Typography:
├── Font chính: Inter, system-ui
└── Font mono: JetBrains Mono (cho timer, ELO) 7. Shared Package (@online-chess/shared)
7.1 Types Được Chia Sẻ
Game Types
Type Mô tả
PieceColor 'white' | 'black'
PieceType 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
ChessPiece { type, color }
Position { row, col } — tọa độ bàn cờ
Move { from, to, promotion? } — nước đi
GameStatus 9 trạng thái: waiting → active → check → checkmate/stalemate/draw/resigned/timeout/abandoned
TimeControl { initialTime, increment } — cài đặt thời gian
GameState Trạng thái đầy đủ: board, turn, status, history, timers, players
GameResult { winner, reason } — kết quả trận đấu
GameMode 'rapid' | 'blitz' | 'bullet' | 'classical' | 'custom'
GameSettings { mode, timeControl, rated }
AIGameSettings Extends GameSettings + aiDifficulty: 1-5
MoveValidation { isValid, isCheck, isCheckmate, isStalemate, isDraw, capturedPiece? }
Socket Types (Type-safe Events)
Event Direction Events
Client → Server createGame, joinGame, makeMove, resignGame, offerDraw, respondToDraw, sendMessage, startAIGame, requestRematch, getOnlinePlayers
Server → Client gameCreated, gameJoined, gameState, moveMade, gameOver, drawOffer, drawResponse, chatMessage, error, opponentDisconnected, opponentReconnected, timeUpdate, rematchOffer, rematchResponse, onlinePlayersCount, matchFound
User Types
Type Mô tả
UserProfile id, username, email, avatarUrl, eloRating, timestamps
PublicUserProfile Subset không có email
UserStats totalGames, wins, losses, draws, winRate, streaks
7.2 Constants Được Chia Sẻ
Constant Giá trị
INITIAL_BOARD_SETUP Ma trận 8×8 khởi tạo bàn cờ
TIME_CONTROLS Bullet: 1'+0", Blitz: 3'+2", Rapid: 10'+5", Classical: 30'+10"
PIECE_VALUES ♙100, ♞320, ♗330, ♖500, ♕900, ♔20000
ELO_K_FACTOR 32
AI_DIFFICULTY_DEPTH Level 1→depth 2, Level 2→3, Level 3→4, Level 4→5, Level 5→6
MAX_GAME_TIME_MS 3,600,000 (1 giờ)
RECONNECT_TIMEOUT_MS 30,000 (30 giây)
ABANDON_TIMEOUT_MS 60,000 (60 giây)
MAX_CHAT_MESSAGE_LENGTH 500 ký tự
SOCKET_NAMESPACES /game, /lobby, /chat 8. Cơ Sở Dữ Liệu
8.1 Database Schema (Prisma + PostgreSQL)
8.2 Chiến Lược Lưu Trữ
Dữ liệu Nơi lưu Lý do
User profiles, game history PostgreSQL Persistent, relational
Active game state Redis Low-latency, in-memory
Matchmaking queue Redis Fast queue operations
Session tokens Redis Expirable, fast lookup
Completed games PostgreSQL Lưu trữ lâu dài + query 9. Hệ Thống Real-time (WebSocket)
9.1 Socket.IO Architecture
9.2 Luồng Xử Lý Nước Đi
9.3 Type-safe Socket Communication

Cả client và server import cùng interface ClientToServerEvents và ServerToClientEvents từ @online-chess/shared, đảm bảo:

✅ Tên event khớp nhau
✅ Payload type khớp nhau
✅ IDE autocomplete cho cả 2 phía
✅ Compile-time error nếu sai type 10. Chess Engine & AI
10.1 Chess Engine (ChessEngine.ts)

Engine cờ vua đầy đủ luật chơi:

Tính năng Chi tiết
Board representation Ma trận 8×8 (ChessPiece | null)
Move generation Sinh tất cả nước đi hợp lệ cho mỗi loại quân
Special moves Nhập thành (vua/hậu), bắt tốt qua đường (en passant), phong tốt
Check detection Phát hiện chiếu, ghim quân (pin)
Legal move filter Loại bỏ nước đi khiến vua bị chiếu
Game end detection Chiếu hết, hòa bí, hòa 50 nước, lặp 3 lần, thiếu quân
PGN support Ghi chép ván cờ theo chuẩn PGN
10.2 AI Engine — Minimax với Alpha-Beta Pruning
Cấp Độ Khó
Level Depth Mô tả
1 2 Người mới bắt đầu
2 3 Cơ bản
3 4 Trung bình
4 5 Nâng cao
5 6 Chuyên gia
Hàm Đánh Giá (Board Evaluator)
Yếu tố Mô tả
Material Tổng giá trị quân: ♙100, ♞320, ♗330, ♖500, ♕900, ♔20000
Piece-Square Tables Bonus/penalty theo vị trí mỗi quân trên bàn cờ
Pawn Structure Phạt tốt đôi, tốt cô lập; thưởng tốt thông
King Safety Đánh giá lá chắn tốt, cột mở gần vua
Mobility Số nước đi hợp lệ có sẵn
Center Control Bonus kiểm soát ô e4, d4, e5, d5
Endgame Piece-square tables riêng cho tàn cuộc (vua tiến vào tâm)
Kỹ Thuật Tối Ưu
Alpha-Beta Pruning: Cắt tỉa nhánh không cần thiết, giảm đáng kể không gian tìm kiếm
Move Ordering: Xét nước bắt quân trước → chiếu → khác (tăng hiệu quả pruning)
Iterative Deepening: Tìm kiếm sâu dần (tùy chọn cho giới hạn thời gian)
Quiescence Search: Mở rộng tìm kiếm trong chuỗi bắt quân, tránh hiệu ứng chân trời 11. Xác Thực & Bảo Mật
11.1 Luồng Xác Thực
11.2 Bảo Mật
Lớp Cơ chế
Transport CORS configured với whitelist origins
Headers Helmet (X-Frame-Options, CSP, HSTS, etc.)
Rate Limiting 100 requests / 15 phút / IP
Password bcryptjs hash (auto-salt)
Token JWT với secret key, hết hạn 7 ngày
Input Zod schema validation trên mỗi endpoint
Socket Auth JWT verify trước khi chấp nhận kết nối WebSocket
Chat Giới hạn 500 ký tự, rate limit 12. Hạ Tầng & Deployment
12.1 Docker Compose Services
12.2 Environment Variables
Biến Mục đích Ví dụ
DATABASE_URL PostgreSQL connection string postgresql://chess:chess@localhost:5432/online_chess
PORT Server port 3001
NODE_ENV Môi trường development
JWT_SECRET JWT signing secret —
JWT_EXPIRES_IN JWT expiry 7d
CLIENT_URL Frontend URL (CORS) http://localhost:5173
REDIS_URL Redis connection string redis://localhost:6379
GOOGLE_CLIENT_ID Google OAuth client ID —
GOOGLE_CLIENT_SECRET Google OAuth secret —
GOOGLE_CALLBACK_URL OAuth callback URL http://localhost:3001/api/auth/google/callback 13. Luồng Hoạt Động Chính
13.1 Tạo & Chơi Game Multiplayer
13.2 Matchmaking Flow
13.3 Chơi Với AI 14. Sơ Đồ Kiến Trúc
14.1 System Overview
14.2 Data Flow Overview

IMPORTANT

Tóm tắt kiến trúc: Dự án sử dụng mô hình monorepo với 3 workspace packages, giao tiếp real-time qua Socket.IO (type-safe), chess engine tự viết với AI Minimax + Alpha-Beta Pruning, xác thực qua JWT + Google OAuth, dữ liệu được phân tầng giữa PostgreSQL (persistent) và Redis (ephemeral), frontend dùng React + Zustand với animation Framer Motion.

TIP

Điểm mạnh thiết kế:

Type-safe end-to-end nhờ shared package
Tách biệt rõ ràng giữa game state (Redis) và data persistence (PostgreSQL)
AI engine modular với board evaluator tách riêng
Component architecture sạch sẽ, dễ mở rộng
Monorepo giúp chia sẻ code hiệu quả giữa frontend/backend

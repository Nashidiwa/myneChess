# Deployment & Operations Guide

## 1. Local Development Setup (Quickstart)

### Prerequisites
- **Node.js**: $\ge$ v20 (Tested on Node.js v22.18.0)
- **npm**: $\ge$ v10 (Tested on npm 11.12.0)
- **PostgreSQL**: (Optional for local dev thanks to the resilient in-memory fallback store)

### Step-by-Step Installation
1. **Clone repository & Install dependencies**:
   ```bash
   git clone <repo-url>
   cd DoAnCoSo4.1
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Build Monorepo Packages**:
   ```bash
   npm run build
   ```

4. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

5. **Start Development Servers**:
   In two separate terminal windows (or using npm workspace commands):
   ```bash
   # Terminal 1: Backend Server (Port 4000)
   npm run dev:server

   # Terminal 2: Web Frontend (Port 5173)
   npm run dev:web
   ```
   Open your browser to `http://localhost:5173`.

---

## 2. Docker & Docker Compose Deployment

The platform provides a complete multi-container `docker-compose.yml` orchestrating PostgreSQL 16, the Express backend, and the React frontend.

```mermaid
flowchart LR
    Browser["Client Web Browser"] -->|Port 5173| WebContainer["online_chess_web (Nginx / Vite)"]
    Browser -->|Port 4000 (REST & Sockets)| ServerContainer["online_chess_server (Node.js)"]
    ServerContainer -->|Port 5432| DBContainer[("online_chess_postgres (PostgreSQL 16)")]
    DBContainer --- Vol["postgres_data (Persistent Volume)"]
```

### Docker Startup Commands
```bash
# Build and start all services in detached mode
docker compose up -d --build

# Run database migrations within the server container
docker compose exec server npx prisma migrate deploy

# Seed initial admin user and data
docker compose exec server npx prisma db seed

# View real-time logs
docker compose logs -f server
```

---

## 3. Production Environment Configuration

Create a `.env` file based on `.env.example`:

| Environment Variable | Production Recommendation | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and disables debug logs |
| `PORT` | `4000` | HTTP and WebSocket binding port |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/online_chess?schema=public` | Connection URI to production PostgreSQL cluster |
| `JWT_SECRET` | 64+ random characters (e.g. `openssl rand -hex 32`) | Secret key for signing HMAC-SHA256 JWT tokens |
| `JWT_EXPIRES_IN` | `1d` or `12h` | Expiration window for access tokens |
| `CORS_ORIGIN` | `https://yourchessdomain.com` | Strict CORS origin restricting cross-site requests |
| `LOG_LEVEL` | `info` or `warn` | Logging granularity (Pino JSON formatted logs) |

---

## 4. Cloud & WebSocket Considerations

When deploying behind reverse proxies (Nginx, Cloudflare, Traefik, or AWS ALB):
1. **WebSocket Upgrade Headers**:
   Nginx must be configured to pass the `Upgrade` and `Connection "Upgrade"` headers:
   ```nginx
   location /socket.io/ {
       proxy_pass http://localhost:4000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "Upgrade";
       proxy_set_header Host $host;
       proxy_read_timeout 86400s;
   }
   ```
2. **Horizontal Scaling & Multi-Instance Clusters**:
   To run multiple backend instances behind a load balancer, attach `@socket.io/redis-adapter` to distribute room broadcasts and synchronize active game clock intervals.

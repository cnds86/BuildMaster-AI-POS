# Developer Onboarding Guide — MHX-POS

**Version:** 1.0.0  
**Date:** 2026-05-23  
**Owner:** Elysia — Head of ICT  
**Audience:** นักพัฒนาใหม่ที่เข้ามาร่วมทีม MHX-POS

---

## 🏁 First Day Checklist

### 1. Environment Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd MHX-POS

# 2. ติดตั้ง dependencies
bun install

# 3. Copy environment file
cp .env .env.local
# ถาม Elysia สำหรับ development values

# 4. Start infrastructure (Docker)
docker-compose -f infra/docker-compose.yml up -d

# 5. Run database migrations
bun run migrate

# 6. Seed development data (optional)
bun run seed

# 7. Start dev server
bun run dev
# Frontend: http://localhost:5176
# Backend:  http://localhost:3006
```

### 2. Tools ที่ต้องมี

| Tool | Version | Purpose |
|------|---------|---------|
| Bun | latest | Runtime + package manager |
| Docker | latest | Local infrastructure |
| Git | latest | Version control |
| Node.js | 20+ | (fallback ถ้าไม่ใช้ Bun) |

### 3. Access ที่ต้องขอ

- [ ] GitHub repository access — ติดต่อ Elysia
- [ ] Docker socket access (ถ้าต้องใช้)
- [ ] Cloudflare dashboard (ถ้าต้อง manage tunnels)

---

## 📁 Project Structure

```
MHX-POS/
├── server/           # Backend (Elysia.js + Bun)
│   ├── index.ts      # Main entry point
│   ├── db.ts         # Database connection (Kysely + PostgreSQL)
│   ├── plugins/      # Auth, logging, rate limiting middleware
│   │   ├── auth.ts   # JWT authentication
│   │   └── logging.ts # Audit logging
│   ├── routes/       # API endpoints
│   │   ├── ai.ts     # AI chat (Gemini)
│   │   └── print.ts  # Receipt printing
│   ├── services/    # Business logic
│   ├── types/        # TypeScript types
│   └── seed.ts       # Development seed data
├── src/              # Frontend (React + Vite + Tailwind)
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page-level components
│   ├── lib/          # Utilities, API client, stores
│   │   └── api.ts    # Axios-based API client
│   ├── stores/       # Zustand state management
│   └── App.tsx       # Main app (hash-based routing)
├── infra/            # Docker configuration
├── docs/             # Documentation
│   ├── INCIDENT-RUNBOOK.md    # How to handle incidents
│   ├── SECURITY-AUDIT.md      # Security checklist
│   ├── CONTRIBUTING.md         # Commit convention + PR process
│   ├── CODE-REVIEW-PROCESS.md # How to review code
│   └── IT-STATUS-REPORT-*.md  # Status reports
├── .env.local        # Environment variables (NEVER commit!)
├── package.json
└── vite.config.ts
```

---

## 🔑 Key Concepts

### Architecture: Frontend ↔ Backend

```
[React Frontend] ←→ [Elysia.js API] ←→ [PostgreSQL]
     ↓
[Vite Dev Server]     [Bun Runtime]
  Port 5176             Port 3006
```

### Authentication Flow

```
User → POST /auth/login → JWT cookie set
     → Subsequent requests → Cookie auto-sent
     → Server validates JWT → Protected routes accessible
```

- JWT expires: 8 hours
- Auth token stored in HTTP-only cookie (not localStorage)
- PIN required for sensitive ops (discounts > X, cancellations)

### Database Access Pattern

```typescript
// ใช้ Kysely (type-safe query builder)
import { db } from '../db'

// Query
const products = await db
  .selectFrom('products')
  .select(['id', 'name', 'price'])
  .where('category_id', '=', categoryId)
  .execute()

// Insert
await db
  .insertInto('orders')
  .values({ ... })
  .execute()
```

### State Management (Frontend)

- **Zustand** stores in `src/lib/stores/`
- Key stores: `useAuthStore`, `usePosStore`, `useOrderStore`
- Sidebar navigation via URL hash (`window.location.hash`)

### Environment Variables

```env
# สิ่งที่ต้องมีใน .env.local:
JWT_SECRET=<min-32-char-random-string>
DATABASE_URL=postgresql://mhxpos:***@localhost:54340/mhxpos
GEMINI_API_KEY=<key>
PORT=3006
```

---

## 🎯 Common Tasks

### Adding a new API endpoint

```typescript
// server/routes/new-feature.ts
import { Elysia } from 'elysia'
import { authMiddleware } from '../plugins/auth'

export const newFeatureRoute = new Elysia()
  .guard({ auth: true }) // require JWT
  .post('/api/new-feature', async ({ body, set, user }) => {
    // body: typed request body
    // user: from JWT (already validated by middleware)
    // set: for errors
    return { success: true, data: {} }
  }, {
    body: t.Object({ ... })
  })
```

### Adding a new frontend page

```typescript
// src/pages/NewPage.tsx
export function NewPage() {
  // ใช้ existing stores/components
  // ต้องเพิ่ม route ใน App.tsx sidebar hash
  return <div>...</div>
}
```

### Running tests

```bash
# Backend unit tests
bun run test

# Frontend build check
bun run build

# Lint check
bun run lint
```

---

## 📖 Documentation Links

| Document | Purpose |
|----------|---------|
| `docs/INCIDENT-RUNBOOK.md` | How to respond to system incidents |
| `docs/SECURITY-AUDIT.md` | Security checklist before deploy |
| `docs/CONTRIBUTING.md` | Commit convention + branch strategy |
| `docs/CODE-REVIEW-PROCESS.md` | How to review + merge code |
| `docs/IT-STATUS-REPORT-*.md` | Previous status reports (examples) |
| `READY.md` | Project delivery documentation |

---

## 🚨 Important Rules

### DO:
- ถามถ้าไม่เข้าใจ — ถาม Elysia หรือ senior dev
- Commit บ่อย — แต่ละ commit ต้องมี meaning
- Run `bun run build` ก่อน commit — ต้อง pass
- Update docs ถ้าเปลี่ยน behavior

### DON'T:
- commit secrets / .env.local
- merge เข้า main โดยไม่ผ่าน review
- disable linter หรือ tests
- leave `console.log` หรือ `TODO` ใน production code

---

## 🆘 Getting Help

| Issue | Who to Ask |
|-------|------------|
| Environment setup | Elysia |
| Code questions | Elysia |
| Access / Permissions | Elysia |
| Incident response | ดู `docs/INCIDENT-RUNBOOK.md` ก่อน |
| Security concerns | Elysia ทันที |

**Emergency contact:** Elysia — ICT Head  
**Communication:** Telegram (bot: Alysa) หรือ direct message

---

**Last updated:** 2026-05-23  
**Next review:** 2026-06-23
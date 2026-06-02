# Contributing to MHX-POS

## 📋 Commit Convention

We follow **Conventional Commits** (https://www.conventionalcommits.org/)

### Format

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructure, no feature/fix |
| `test` | Adding/updating tests |
| `chore` | Maintenance (deps, configs) |
| `perf` | Performance improvements |
| `ci` | CI/CD pipeline changes |
| `build` | Build system changes |
| `revert` | Revert a previous commit |

### Examples

✅ **Good:**
```
feat(pos): add barcode scan shortcut
fix(auth): prevent JWT expiry edge case
docs: update API documentation
refactor(orders): extract calculateTotal helper
chore(deps): upgrade Elysia.js to 1.1
fix(dashboard): correct sales chart date range
```

❌ **Bad:**
```
Fixed stuff
WIP
Update
asdf
_update README
```

### Breaking Changes

Add `!` after type:
```
feat(api)!: change response format
```

### Body (if needed)

Use body for explaining **why**, not what (what is in the description).

```
fix(pos): prevent negative cash input

Previously, negative values could bypass client-side validation.
Added server-side check to reject cash < 0 regardless of client input.
This closes #177.
```

---

## 🔀 Branch Strategy

```
main          — production-ready, always deployable
├── dev        — integration branch for features
├── feat/*     — feature branches (from dev)
├── fix/*      — bug fix branches (from dev)
└── hotfix/*   — emergency fixes (from main)
```

**Rules:**
- Branch off `dev` for features/fixes
- Branch off `main` for hotfixes only
- Merge via PR → review required → merge
- `main` is protected — no direct pushes

### Branch Naming

```
feat/pos-barcode-scan
fix/auth-jwt-expiry
chore/update-dependencies
hotfix/security-patch
```

---

## ✅ PR Checklist

Before opening a PR:

- [ ] Commits follow convention (checked by hook automatically)
- [ ] Tests pass: `bun run test` (or `bun run build` for frontend-only)
- [ ] No `console.log`, `debugger`, or `TODO` left in code (except in test files)
- [ ] Self-reviewed your own diff
- [ ] PR description explains **why**, not just what

### PR Template

```markdown
## Summary
Brief description of what this PR does.

## Why?
Why is this change needed?

## Testing
How did you test this?

## Screenshots (if applicable)
```

---

## 🧪 Code Quality

- **Security first:** Check for SQL injection, XSS, hardcoded secrets
- **Server-side validation:** Never trust client input
- **Meaningful names:** Variables/functions must be self-explanatory
- **Small functions:** If a function does more than one thing, split it

---

## 📁 File Organization

```
MHX-POS/
├── server/           # Backend (Elysia.js/Bun)
│   ├── index.ts      # Entry point
│   ├── db.ts         # Database connection
│   ├── plugins/      # Auth, logging, middleware
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   └── types/        # TypeScript types
├── src/              # Frontend (React/Vite)
│   ├── components/   # UI components
│   ├── pages/        # Page-level components
│   ├── lib/          # Utilities, API client
│   └── App.tsx       # Main app
├── infra/            # Docker, migrations
├── docs/             # Documentation
└── .env.local        # Environment (never commit!)
```

---

**Questions?** Ask Elysia (Head of ICT)
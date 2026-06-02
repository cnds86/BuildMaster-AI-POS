# MHX-POS Code Review Process

**Version:** 1.0.0  
**Date:** 2026-05-23  
**Owner:** Elysia — Head of ICT

---

## 🎯 Purpose

Code review = ตรวจให้คุณภาพ ไม่ใช่ approve เพราะเป็นคนรู้จัก  
ทุก PR ต้องมี review ก่อน merge เข้า main/dev

---

## 👥 Roles

| Role | Responsibility |
|------|---------------|
| **Author** | เขียน code + self-review ก่อนขอ review |
| **Reviewer** | ตรวจ code + ให้ feedback |
| **Merge permission** | Elysia (Head of ICT) — เท่านั้น |

---

## 📋 Review Checklist

### 1. Security First (ต้อง pass ทุกข้อ)

- [ ] **No hardcoded secrets** — password/token/api-key ไม่อยู่ใน code
  ```bash
  rg "password|secret|token|api.key" --type ts --no-ignore -l server/src src/
  # ยกเว้น: test fixtures ใน __tests__/
  ```

- [ ] **SQL injection safe** — ใช้ parameterized queries (Kysely ทำอัตโนมัติ)
  ```bash
  # ตรวจ: ถ้ามี string interpolation ใน query → reject
  ```

- [ ] **Input validation** — server-side validation มี, client-only ไม่พอ
- [ ] **XSS prevention** — user input ถูก sanitize ก่อน render
- [ ] **Auth/Authz** — JWT validation + role check มีใน protected routes

### 2. Code Quality

- [ ] **Function size** — function ควรสั้น < 30 lines ถ้าทำได้
- [ ] **Meaningful names** — variable/function names สื่อความหมาย
- [ ] **No dead code** — unused imports/variables ถูก remove
- [ ] **Error handling** — try/catch มี, error messages ชัดเจน

### 3. Functionality

- [ ] **Works as intended** — code ทำสิ่งที่ PR description บอก
- [ ] **Tests pass** — unit tests เขียนถูกต้อง (ถ้ามี)
- [ ] **No breaking changes** — ถ้าเปลี่ยน API ต้อง update consumers

### 4. Performance

- [ ] **No N+1 queries** — ถ้า loop query DB ให้ reject
- [ ] **Connection pooling** — DB connections ถูก reuse
- [ ] **No unnecessary re-renders** (frontend) — React components optimize ถ้าจำเป็น

### 5. Documentation

- [ ] **PR description ชัดเจน** — มี why, not just what
- [ ] **Complex logic มี comment** — บรรทัดที่ไม่ชัดเจนต้องอธิบาย
- [ ] **DOCS.md updated** — ถ้าเปลี่ยน behavior ที่ user ต้องรู้

---

## 🔍 Review Process

```
Author                  Reviewer
  │                        │
  │── Submit PR ──────────>│
  │                        │
  │   Self-review first    │
  │   (checklist above)    │
  │                        │
  │<── Comment/Request ────│
  │                        │
  │── Address feedback ───>│
  │                        │
  │   Repeat until:        │
  │   ✓ All comments      │
  │     resolved           │
  │   ✓ Checklist passes   │
  │                        │
  │<── Approve ───────────│
  │                        │
  │── Merge ──────────────>│ (Elysia only)
```

---

## 💬 Giving Feedback

### ✅ Do:

- ใช้ "nit:" สำหรับ minor suggestions ที่ไม่ต้องแก้ก่อน merge
- อธิบาย **why** ให้ author เข้าใจว่าทำไมต้องแก้
- Offer suggestion (ช่วยเขียน code ให้ดู) ถ้าเห็นวิธีที่ดีกว่า
- Praise สิ่งที่ทำดี — positive feedback สำคัญ

### ❌ Don't:

- "LGTM" โดยไม่ดู code จริง
- "This is wrong" โดยไม่บอกว่าควรเป็นอย่างไร
- Block PR เพราะ style preference ที่ไม่มีใน linter
- Request changes สำหรับของที่ไม่อยู่ใน PR scope

### Comment Format:

```
## [type] Line X — Short description

Explanation of why this needs to be changed.

Suggestion:
```typescript
// suggested fix
```
```

---

## ⚖️ Approval Rules

| Situation | Required Approvals |
|-----------|-------------------|
| Regular PR | 1 reviewer (Elysia หรือ senior dev) |
| Security-related | 1 reviewer + Elysia |
| Infrastructure | Elysia required |
| Hotfix | 1 reviewer (fast track) |

---

## 🚨 When to Reject (hard no)

1. **Secrets in code** — hardcode password/token ต้อง reject และ fix ทันที
2. **SQL injection possible** — string interpolation ใน query
3. **No input validation** — trust client input โดยไม่มี server-side check
4. **Breaking change without notice** — เปลี่ยน API โดยไม่ warn consumers
5. **Tests intentionally disabled** — skip/bypass tests ต้องมีเหตุผลที่ดี

---

## 🔧 Tools

```bash
# Run linter before PR
bun run lint

# Run type check
bun run typecheck

# Run tests
bun run test

# Build check
bun run build
```

**CI:** ทุก PR ต้อง pass CI ก่อนจะ merge

---

## 📅 Review Schedule

- **PRs ต้องถูก review ภายใน 24 ชม.** — ถ้าเลย ให้ ping reviewer
- **Hotfix ต้องถูก review ภายใน 2 ชม.**
- **ของเล็ก (docs, chore):** อาจ approve ได้เร็วกว่านี้ แต่ต้องมี reviewer อย่างน้อย 1 คน

---

**Next Review:** 2026-06-23  
**Changes:** ปรับปรุงตาม feedback จากทีม
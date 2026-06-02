# MHX-POS Security Audit Checklist

**Version:** 1.0.0  
**Date:** 2026-05-23  
**Owner:** Elysia — Head of ICT  
**Scope:** MHX-POS (Frontend + Backend + Infrastructure)

> ⚠️ **Pre-requisite:** ทำทุกครั้งก่อน deploy ไป production และหลังจากมี major changes

---

## 🔐 Authentication & Authorization

- [ ] **JWT_SECRET** — ต้องเป็น 256-bit random, ไม่ใช่ default/dev value
  ```bash
  # Verify: secret ต้องมีความยาวอย่างน้อย 32 ตัวอักษร
  grep JWT_SECRET .env.local
  # และต้องไม่เป็นค่าอย่าง "secret", "password", "dev"
  ```

- [ ] **JWT expiry** — 8h หรือน้อยกว่า (ไม่ควรเป็น unlimited)
  ```bash
  grep JWT_EXPIRES_IN .env.local
  ```

- [ ] **Login rate limiting** — 5 attempts per 15 min หรือดีกว่า
  ```bash
  # ทดสอบ: ล็อกอินผิด 6 ครั้งใน 15 นาที → attempt ที่ 6 ต้องถูก block
  ```

- [ ] **Password policy** — min 8 chars, server-side validation
  ```bash
  # ลอง register ด้วย password < 8 chars → ต้อง fail
  curl -X POST http://localhost:3006/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"123","role":"admin"}'
  ```

- [ ] **Role-based access** — cashier ใช้ API ของ admin ไม่ได้
  ```bash
  # Login เป็น cashier → ลอง POST /api/orders ด้วย PIN admin → ต้อง fail 401/403
  ```

- [ ] **PIN verification** — sensitive ops (discount > threshold, cancel order) ต้องใช้ PIN
  ```bash
  # ลอง cancel order โดยไม่มี PIN → ต้อง fail 401
  curl -X PUT http://localhost:3006/api/orders/999/status \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"status":"cancelled"}'
  ```

- [ ] **No hardcoded credentials** — ไม่มี password/token ใน code
  ```bash
  rg "password|secret|token|api.key" --type ts --no-ignore -l server/src server/src
  # ยกเว้น: test fixtures ที่อยู่ใน __tests__/
  ```

---

## 🌐 Network & API Security

- [ ] **CORS whitelist** — ไม่ใช่ wildcard `*`
  ```bash
  # ตรวจ: ถ้าไม่มี CORS_ORIGIN ใน .env → ต้องมี explicit list ใน server
  grep -r "cors" server/src --include="*.ts" | grep -v node_modules
  ```

- [ ] **Rate limiting** — global 200 req/min, auth 5 attempts/15min
  ```bash
  # ทดสอบ: curl ซ้ำ 201 ครั้งใน 1 นาที → request ที่ 201+ ต้อง return 429
  ```

- [ ] **No sensitive data in URLs** — query params ไม่มี password/token
  ```bash
  # ตรวจ: API ที่มี auth token ใช้ header ไม่ใช่ query string
  # ถ้าใช้ ?token=xxx → นี่คือ vulnerability
  ```

- [ ] **HTTPS enforced** — production ต้องเป็น HTTPS (Cloudflare tunnel)
  ```bash
  # ตรวจ: Cloudflare tunnel รันอยู่ไหม
  cloudflared tunnel list
  curl -I https://opcd196.mahaxaygroup.com  # ต้อง redirect HTTP→HTTPS หรือ enforce HTTPS
  ```

---

## 💾 Data Security

- [ ] **Server-side price calculation** — ราคามาจาก server ไม่ใช่ client
  ```bash
  # ตรวจ: POST /api/orders ส่ง price จาก client → server ต้อง ignore และคำนวณเอง
  # ดูใน server/routes/orders.ts ว่ามีการดึง price จาก DB ไม่ใช่จาก request body
  ```

- [ ] **SQL injection** — ใช้ parameterized queries (Kysely ทำอัตโนมัติแล้ว)
  ```bash
  # ทดสอบ: username="admin' OR '1'='1" → ต้องไม่ได้ access
  curl -X POST http://localhost:3006/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"x"}'
  ```

- [ ] **XSS prevention** — user input ถูก encode ก่อน render
  ```bash
  # ตรวจ: ลอง POST ด้วย <script>alert(1)</script> ใน product name
  # ถ้าไม่มี sanitization → vulnerability
  ```

- [ ] **No secrets in git** — .env, .env.local ไม่เคย commit
  ```bash
  git log --all --full-history -S "JWT_SECRET"
  git diff --cached .env .env.local 2>/dev/null
  cat .git/hooks/pre-commit 2>/dev/null | grep -i env || echo "No pre-commit hook"
  ```

---

## 🐳 Infrastructure Security

- [ ] **Docker containers** — ไม่ run เป็น root
  ```bash
  docker exec mhx-pos id  # ต้องไม่ใช่ uid 0
  docker exec postgres id  # ต้องไม่ใช่ uid 0
  ```

- [ ] **Docker socket** — ถ้ามี access ต้องมี justification
  ```bash
  ls -la /home/cnds86/.docker/desktop/docker.sock
  # ตรวจว่า user ที่ใช้อยู่ใน docker group หรือเปล่า
  groups $USER | grep docker
  ```

- [ ] **Database port** — PostgreSQL (54340) ต้องไม่ expose ไป public
  ```bash
  # ทดสอบจากเครื่องอื่น: nmap -p 54340 localhost
  # ถ้าเปิด public → นี่คือ critical vulnerability
  ```

- [ ] **Cloudflare tunnels** — credentials ปลอดภัย
  ```bash
  # ตรวจ: ~/.cloudflared/ config ต้องเป็น 600 permission
  ls -la ~/.cloudflared/
  ```

---

## 🔧 Application Security

- [ ] **Input validation** — negative values, extreme values ถูก reject
  ```bash
  # ทดสอบ:
  # POST /api/orders ด้วย cash = -100 → ต้อง fail
  # POST /api/orders ด้วย quantity = 999999 → ต้อง fail (reasonable limit)
  curl -X POST http://localhost:3006/api/orders \
    -H "Content-Type: application/json" \
    -d '{"cash":-100,"items":[...]}'  # ต้อง return 400
  ```

- [ ] **Barcode encoding** — barcode ถูก encode ก่อนใช้
  ```bash
  # ทดสอบ: ส่ง barcode = "<img src=x onerror=alert(1)>"
  # ถ้าไม่มี encodeURIComponent หรือ sanitize → XSS
  ```

- [ ] **Audit logging** — sensitive ops ถูก log
  ```bash
  # ตรวจ: login, logout, order cancel, discount, PIN verification ต้องมี log
  grep -r "audit\|log" server/src --include="*.ts" | grep -v node_modules | head -20
  ```

- [ ] **Error messages** — ไม่เปิดเผย system details ใน production
  ```bash
  # ทดสอบ: ลองใส่ invalid input แล้วดู error message
  # ต้องเป็น generic message ไม่ใช่ stack trace
  curl -X POST http://localhost:3006/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"x","password":"y"}'
  # Response ต้องไม่มี: "JWT_SECRET is not set", "stack trace", "postgres error"
  ```

---

## 🖥️ Host Security (192.168.1.34 Windows Server)

- [ ] **MSSQL service** — ใช้ strong SA password
  ```bash
  # เช็คผ่าน Windows admin: เปลี่ยน SA password เป็น strong password แล้ว
  ```

- [ ] **Remote Desktop** — ไม่เปิด public ใช้ VPN หรือ limited IP
  ```bash
  # ตรวจ: ดูว่า RDP (port 3389) ถูก block จาก public หรือเปล่า
  ```

- [ ] **Backup validation** — backup ที่ทำอยู่ใช้งานได้จริง
  ```bash
  # ทดสอบ restore: ลอง restore จาก backup ล่าสุดใน D:/SQLBackups/
  # และตรวจว่า backup ทำ schedule ไว้ถูกต้อง
  ```

---

## ✅ Pre-Deployment Checklist

```bash
# ก่อน deploy ไป production:
# 1. Security scan
rg "TODO|FIXME|HACK|XXX" server/src --type ts -i  # หา code ที่ยังไม่เสร็จ

# 2. Dependencies audit
cd /home/cnds86/projects/MHX-POS && npm audit --audit-level=high

# 3. Build passes
bun run build

# 4. ตรวจ environment
# - JWT_SECRET เป็นค่า production ไม่ใช่ dev
# - CORS_ORIGIN ชี้ไปที่ domain จริง
# - DB_PASSWORD เปลี่ยนจาก default
# - GEMINI_API_KEY ถูก set

# 5. Final security check
grep -r "console.log\|debugger\|TODO" server/src --include="*.ts" | grep -v test | grep -v node_modules || echo "Clean"
```

---

## 📊 Audit Schedule

| Frequency | Scope | Owner |
|-----------|-------|-------|
| **Before each deploy** | Full checklist | Elysia |
| **Monthly** | Review logs, check for anomalies | Elysia |
| **Quarterly** | Full infrastructure review | Elysia + External |
| **After security incident** | Affected areas only | Elysia |

---

**Last Audit:** 2026-05-23  
**Next Scheduled:** 2026-06-23  
**Severity Scale:** CRITICAL / HIGH / MEDIUM / LOW
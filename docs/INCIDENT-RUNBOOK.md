# MHX-POS Incident Response Runbook

**Version:** 1.0.0  
**Date:** 2026-05-23  
**Owner:** Elysia — Head of ICT  
**Last Updated:** 2026-05-23

---

## 🎯 Purpose

ช่วยให้ตอบ incident ได้รวดเร็ว ไม่ตื่นตระหนก และไม่พลาด critical steps ที่อาจทำให้ระบบแย่ลง

---

## 🚦 Incident Classification

| Severity | Definition | Response Time | Examples |
|----------|------------|---------------|----------|
| **P1 — Critical** | ระบบล่มทั้งหมด / ข้อมูลสูญ | **15 นาที** — ต้องตื่นทันที | DB down, auth down, ข้อมูลหาย |
| **P2 — High** | ฟีเจอร์หลักใช้ไม่ได้ | **1 ชั่วโมง** | Order creation fail, payment fail, AI chat down |
| **P3 — Medium** | ฟีเจอร์รองใช้ไม่ได้ / performance แย่ | **4 ชั่วโมง** | Dashboard slow, search lag, print fail |
| **P4 — Low** | bug เล็กน้อย / cosmetic | **24 ชั่วโมง** | UI glitch, typo, non-critical error |

---

## 📋 Incident Response Workflow

### Step 1: Assess (30 วินาทีแรก)

```
❓ ระบบยังทำงานได้ไหม?
  ├── ทั้งหมดล่ม → P1
  ├── บางส่วนล่ม → P2
  └── ช้าอย่างเดียว → P3/P4
```

**ตรวจสอบเบาๆ:**
- Health check: `curl -s http://localhost:3006/api/health`
- Frontend load: เปิด browser → `http://localhost:5176`
- Docker status: `docker ps | grep mhx`

### Step 2: Communicate (ภายใน 5 นาที)

สำหรับ P1/P2: แจ้ง stakeholders ทันที

```
📍 Format สำหรับ P1/P2:
[INCIDENT] [P1/P2] <system>: <what happened>
Status: Investigating
ETA: TBD
Contact: @elysia
```

### Step 3: Investigate — ใช้ framework นี้

```
1. 🔍 ดู logs ก่อน
   - Backend: docker logs mhx-pos --tail 100
   - หา patterns: ERROR, Exception, timeout

2. 🌐 ตรวจ network
   - Docker containers ยังรันอยู่ไหม: docker ps
   - PostgreSQL reachable หรือเปล่า: docker exec mhx-pos nc -zv db 5432
   - Redis reachable หรือเปล่า: docker exec mhx-pos nc -zv redis 6379

3. 💾 ตรวจ Database
   - DB ยัง accessible: psql -h localhost -p 54340 -U mhxpos -d mhxpos -c "SELECT 1"
   - Disk space: df -h / (PostgreSQL volume)

4. 🔐 ตรวจ Security
   - Failed login attempts: ดู auth logs
   - Unusual traffic: docker stats
   - Secrets leak: ตรวจ .env ยังปลอดภัยไหม
```

### Step 4: Contain (ขั้นตอนกันระบบแย่ลง)

```
⚡ Immediate Actions:

[P1] ถ้า DB down:
  1. docker-compose -f infra/docker-compose.yml restart db
  2. ถ้าไม่ขึ้น → check disk space
  3. ถ้า disk เต็ม → เพิ่ม volume หรือ cleanup logs
  4. ถ้ายังไม่ได้ → restore from backup (ดู Backup section)

[P1] ถ้า Frontend down:
  1. ตรวจ Vite dev server: รันอยู่ไหม
  2. ตรวจ reverse proxy: Nginx/Cloudflare config
  3. Restart: pm2 restart mhx-pos หรือ docker-compose restart

[P2] ถ้า API slow:
  1. ตรวจ DB query performance
  2. ดู connections: SELECT * FROM pg_stat_activity
  3. Restart แค่ API: docker-compose restart server

[P2] ถ้า Auth ใช้ไม่ได้:
  1. ตรวจ JWT_SECRET ยังมีใน .env หรือเปล่า
  2. ตรวจ auth plugin: server/plugins/auth.ts
  3. Restart server
```

### Step 5: Resolve

เมื่อระบบกลับมาทำงานปกติ:
1. Verify — ทดสอบ affected feature ก่อนปิด case
2. Document — เขียนว่าเกิดอะไร แก้อย่างไร
3. Notify — บอก stakeholders ว่าระบบกลับมาแล้ว

### Step 6: Post-Mortem (ภายใน 48 ชม.)

**ทุก P1/P2 ต้องทำ post-mortem**

```markdown
## Post-Mortem: <Incident Title>
**Date:** YYYY-MM-DD  
**Severity:** P1/P2  
**Duration:** X hours Y minutes  
**Root Cause:** (exact cause)

### Timeline
- HH:MM — Issue detected
- HH:MM — Investigation started
- HH:MM — Root cause identified
- HH:MM — Fix applied
- HH:MM — System restored

### Root Cause
(EXACT cause — not symptom)

### Lessons Learned
1. อะไรทำให้เกิด?
2. ทำไมตรวจไม่เจอก่อน incident?
3. จะป้องกันได้อย่างไร?

### Action Items
- [ ] <action> — due <date>
- [ ] <action> — due <date>
```

---

## 🔧 Common Incidents & Fixes

### Incident 1: PostgreSQL Connection Failed

**Symptoms:** `ECONNREFUSED` จาก backend, API returns 500

**Diagnosis:**
```bash
docker ps | grep postgres
docker logs mhx-pos --tail 50 | grep "connect"
```

**Fix:**
```bash
# 1. Check if container is running
docker ps | grep postgres

# 2. If not running, restart
docker-compose -f infra/docker-compose.yml restart db

# 3. If still failing, check disk
df -h /var/lib/docker

# 4. Check DB logs
docker logs postgres --tail 100

# 5. If DB corrupted, restore from backup
# (see Backup section below)
```

---

### Incident 2: JWT Auth Not Working

**Symptoms:** Login สำเร็จแต่หลังจากนั้น API calls 401

**Diagnosis:**
```bash
# Check JWT_SECRET is set
grep JWT_SECRET .env.local
# Should be 256-bit random string

# Check cookie being set
curl -v -X POST http://localhost:3006/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' 2>&1 | grep -i set-cookie
```

**Fix:**
```bash
# 1. Verify JWT_SECRET exists and is strong (min 32 chars)
# If weak/empty → generate new:
openssl rand -base64 32

# 2. Check server/plugins/auth.ts logic
# 3. Clear browser cookies and retry
# 4. Restart server: docker-compose restart server
```

---

### Incident 3: Frontend Returns 502/504

**Symptoms:** เปิด browser ไม่ได้ หรือ loading ค้าง

**Diagnosis:**
```bash
# Check Vite dev server
curl -s -o /dev/null -w "%{http_code}" http://localhost:5176

# Check if port blocked
lsof -i :5176

# Check Cloudflare tunnel status
cloudflared tunnel list
```

**Fix:**
```bash
# If Vite down:
cd /home/cnds86/projects/MHX-POS
bun run dev &

# If Cloudflare tunnel down:
cloudflared --config ~/.cloudflared/config.yaml tunnel run 62c7946c

# If Nginx reverse proxy:
sudo systemctl status nginx
sudo systemctl restart nginx
```

---

### Incident 4: Database Slow / Timeout

**Symptoms:** API calls ใช้เวลานานผิดปกติ > 5 วินาที

**Diagnosis:**
```bash
# Check active connections
psql -h localhost -p 54340 -U mhxpos -d mhxpos \
  -c "SELECT pid, usename, state, query FROM pg_stat_activity WHERE state != 'idle';"

# Check long-running queries
psql -h localhost -p 54340 -U mhxpos -d mhxpos \
  -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC LIMIT 10;"

# Check DB size
psql -h localhost -p 54340 -U mhxpos -d mhxpos \
  -c "SELECT pg_size_pretty(pg_database_size('mhxpos'));"
```

**Fix:**
```bash
# Kill long-running queries (if safe):
SELECT pg_terminate_backend(pid);

# If DB size too large → vacuum:
psql -h localhost -p 54340 -U mhxpos -d mhxpos -c "VACUUM ANALYZE;"

# If connections maxed → check connection pool settings in server/db.ts
# If disk full → cleanup old logs / docker system prune
```

---

### Incident 5: Docker Container Won't Start

**Symptoms:** `docker-compose up -d` fails

**Diagnosis:**
```bash
docker-compose -f infra/docker-compose.yml config  # validate
docker-compose -f infra/docker-compose.yml up
# ดู error ที่แท้จริง
```

**Common Causes:**
- Port already in use: `lsof -i :54340` หรือ `:5176`
- Volume permission: `sudo chown -R $(id -u):$(id -g) ./infra/volumes/`
- .env missing: `cp .env .env.local` แล้ว set values

---

## 💾 Backup & Restore

### Backup (ควรทำ weekly + before major changes)

```bash
# Manual DB backup
pg_dump -h localhost -p 54340 -U mhxpos -d mhxpos > backup_$(date +%Y%m%d_%H%M%S).sql

# Docker volume backup
docker run --rm -v mhx-pos_db-data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz -C /data .
```

### Restore

```bash
# Stop services first
docker-compose -f infra/docker-compose.yml down

# Restore DB
psql -h localhost -p 54340 -U mhxpos -d mhxpos < backup_file.sql

# Start services
docker-compose -f infra/docker-compose.yml up -d
```

---

## 📞 Contacts

| Role | Contact | Notes |
|------|---------|-------|
| ICT Head (Primary) | @elysia | ติดต่อได้ตลอด 24/7 สำหรับ P1 |
| Cloudflare Admin | Elysia | mahaxaygroup.it.levanthay@gmail.com |
| DB Admin | Elysia | ถ้าเกี่ยวกับ PostgreSQL |

---

## 📝 Incident Log Template

```markdown
| Date | Severity | Issue | Duration | Root Cause | Resolution |
|------|----------|-------|----------|------------|------------|
| YYYY-MM-DD | P1 | ... | ... | ... | ... |
```

---

**Next Review:** 2026-06-23  
**Version History:** 1.0.0 — Initial release
# Server Health Check Runbook — MHX Group Windows Servers

**Version:** 1.0.0  
**Date:** 2026-05-23  
**Owner:** Elysia — Head of ICT  
**Scope:** 192.168.1.200, .100, .34, .35

---

## 🚦 Quick Health Check (Daily — 5 นาที)

### SSH Connection Test
```bash
# Test all 4 servers — should return OK
for ip in 192.168.1.200 192.168.1.100 192.168.1.34 192.168.1.35; do
  result=$(sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
    -o PreferredAuthentications=password -o PubkeyAuthentication=no \
    -o ConnectTimeout=5 -p 223 "administrator@$ip" "echo OK" 2>&1)
  echo "$ip: $result"
done
```

### Expected Output
```
192.168.1.200: OK
192.168.1.100: OK
192.168.1.34: OK
192.168.1.35: OK
```

---

## 🔍 Full Health Check (Weekly — 15 นาที)

### 1. Disk Space Check

```bash
# All servers — check for drives below 20% free
for ip in 192.168.1.200 192.168.1.100 192.168.1.34 192.168.1.35; do
  echo "=== $ip ==="
  sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
    -o PreferredAuthentications=password -o PubkeyAuthentication=no \
    -p 223 "administrator@$ip" \
    "wmic logicaldisk get caption,freespace,size /format:csv" 2>&1
done
```

**Alert thresholds:**
| Drive | Critical | Warning |
|-------|----------|---------|
| C: (OS) | < 10 GB | < 20 GB |
| D: (Data) | < 50 GB | < 100 GB |
| L: (SQL Data) | < 100 GB | < 200 GB |

### 2. Services Status Check

**WIN-APP (192.168.1.200) — ES_* Services:**
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.200" \
  "sc query state= all" 2>&1 | grep -E "SERVICE_NAME|DISPLAY_NAME" | \
  grep -iE "ES_AIMsgServer|ES_AIServer|ES_Im_Server|ES_NFS_Server|ES_nginx|ES_Server|ES_ShareDoc_Server|ES_SMCServer|ES_Sync_Server"
```

**Critical services to verify on SQL servers:**
```bash
for ip in 192.168.1.100 192.168.1.34 192.168.1.35; do
  echo "=== $ip ==="
  sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
    -o PreferredAuthentications=password -o PubkeyAuthentication=no \
    -p 223 "administrator@$ip" \
    "sc query SQLSERVERAGENT && sc query MSSQLSERVER && sc query" 2>&1
done
```

### 3. MSSQL Health Check

```bash
# Check databases on SQL_SE (192.168.1.100)
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.100" \
  "sqlcmd -S SQL_SE\\SXSQLSERVER -U sa -P 4533cdRR -Q \"SELECT name, state_desc, recovery_model FROM sys.databases WHERE state != 0\" -y 0" 2>&1
```

**Expected:** No rows returned (all DBs ONLINE)

### 4. Backup Verification

```bash
# Check latest backup on SQL_SE
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.100" \
  "sqlcmd -S SQL_SE\\SXSQLSERVER -U sa -P 4533cdRR -Q \"SELECT TOP 5 database_name, backup_start_date, type, backup_size FROM msdb.dbo.backupset ORDER BY backup_start_date DESC\" -y 0" 2>&1
```

### 5. SQL Server Disk Space

```bash
# Check SQL data/log drives space on all SQL servers
for ip in 192.168.1.100 192.168.1.34 192.168.1.35; do
  echo "=== $ip ==="
  sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
    -o PreferredAuthentications=password -o PubkeyAuthentication=no \
    -p 223 "administrator@$ip" \
    "wmic logicaldisk where \"caption='D:' or caption='L:'\" get caption,freespace,size /format:csv" 2>&1
done
```

---

## 📋 Per-Server Health Checklist

### WIN-APP (192.168.1.200)
- [ ] SSH accessible (port 223)
- [ ] C: > 200 GB free
- [ ] D: > 400 GB free
- [ ] ES_AIMsgServer: Running
- [ ] ES_AIServer: Running
- [ ] ES_nginx: Running
- [ ] ES_Server: Running
- [ ] ES_ShareDoc_Server: Running
- [ ] ES_SMCServer: Running
- [ ] ES_Sync_Server: Running

### SQL_SE (192.168.1.100 / 192.168.1.34)
- [ ] SSH accessible (port 223)
- [ ] C: > 150 GB free
- [ ] D: > 500 GB free
- [ ] L: > 300 GB free
- [ ] MSSQLSERVER: Running
- [ ] SQLSERVERAGENT: Running
- [ ] All DBs: ONLINE
- [ ] Backup exists within 24h

### SQL_SF (192.168.1.35)
- [ ] SSH accessible (port 223)
- [ ] C: > 200 GB free
- [ ] D: > 800 GB free
- [ ] L: > 400 GB free
- [ ] MSSQLSERVER: Running
- [ ] SQLSERVERAGENT: Running

---

## 🚨 Incident Response — Server Down

### Step 1: Confirm connectivity
```bash
# Ping test
nc -z -w 3 192.168.1.200 223

# If fails, try port 3389 (RDP)
nc -z -w 3 192.168.1.200 3389
```

### Step 2: Check if server is online (try RDP)
```bash
# From Linux — try xfreerdp
xfreerdp /u:administrator /p:bks214AA /v:192.168.1.200
```

### Step 3: Check Windows Event Log
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@<IP>" \
  "wevtutil qe Application /c:10 /f:text /rd:true /q:\"*[System[(Level=1 or Level=2)]]\"" 2>&1 | head -50
```

### Step 4: Restart critical service
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@<IP>" \
  "net stop <ServiceName> && net start <ServiceName>" 2>&1
```

### Step 5: Reboot server (last resort)
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@<IP>" \
  "shutdown /r /t 60 /c \"ICT scheduled reboot\" /d p:4:1" 2>&1
```

---

## 🔧 Common Fixes

### Service stopped → Start it
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.200" \
  "net start ES_Server" 2>&1
```

### MSSQL DB stuck in recovery
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.100" \
  "sqlcmd -S SQL_SE\\SXSQLSERVER -U sa -P 4533cdRR -Q \"ALTER DATABASE <db> SET ONLINE\" -y 0" 2>&1
```

### Disk full on D: (SQL Backups)
```bash
# Find old backups to delete
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.100" \
  "dir D:\SQLBackups\ /o:-d" 2>&1
```

---

## 📅 Schedule

| Frequency | Task | Duration |
|-----------|------|---------|
| Daily | Quick connectivity check | 5 min |
| Weekly | Full health check | 15 min |
| Monthly | Backup restore test | 30 min |
| Quarterly | Security audit | 1 hour |

---

**Last Check:** 2026-05-23  
**Next Scheduled:** 2026-05-30
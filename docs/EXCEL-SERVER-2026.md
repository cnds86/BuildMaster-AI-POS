# Excel Server 2026 — WIN-APP (192.168.1.200)

**Version:** 1.0.0  
**Date:** 2026-05-23  
**Owner:** Elysia — Head of ICT  
**Server:** WIN-APP (192.168.1.200)

---

## 📍 Location

```
C:\Program Files (x86)\Cesoft\Excel Server 2026\
```

- **Web Application:** `C:\Program Files (x86)\Cesoft\Excel Server 2026\ESWeb\`
- **Web Server:** IIS (port 8080) + Nginx (port 5010)
- **Port 8080** → IIS ESWeb site → `C:\Program Files (x86)\Cesoft\Excel Server 2026\ESWeb`
- **Port 80** → Default Web Site (inetpub/wwwroot)
- **Port 5010** → Nginx reverse proxy (AI services)
- **Port 80** ถูก tunnel ผ่าน Cloudflare (`mhx-web.mahaxaygroup.com`)

---

## 🌐 Web Access

| URL | Port | Service | Cloudflare |
|-----|------|---------|------------|
| http://192.168.1.200:8080 | 8080 | Excel Server ESWeb (IIS) | ❌ ยังไม่มี tunnel |
| http://192.168.1.200:80 | 80 | IIS Default Site | ❌ ยังไม่มี tunnel |
| http://192.168.1.200:5010 | 5010 | Nginx (AI) | ❌ ยังไม่มี tunnel |
| mhx-web.mahaxaygroup.com | — | → localhost:80 | ✅ มี tunnel แล้ว |

---

## 🏃 Services ที่รัน (Excel Server 2026)

| Service | Path | Port | Status |
|---------|------|------|--------|
| ES_Server | ES_Server.exe | — | Running |
| ES_SMCServer | ES_SMCServer.exe | — | Running |
| ES_Im_Server | ES_Im_Server.exe | — | Running |
| ES_Sync_Server | ES_Sync_Server.exe | — | Running |
| ES_ShareDoc_Server | ESShareDocServer.exe | — | Running |
| ES_AIServer | qzais.exe | 5001 | Running |
| ES_AIMsgServer | qzaim.exe | 5002 | Running |
| ES_nginx | nginx.exe | 5010 | Running |
| NFS_Server | NFS_Server.exe | — | Running |
| ESSvcMgr | ESSvcMgr.exe | — | Running |

---

## 🗄️ Database Connections

Excel Server 2026 ใช้ MSSQL บน 192.168.1.100 (SQL_SE\SXSQLSERVER)

Databases ที่เกี่ยวข้อง:
- ESApp3, ESApp2, ESApp1, ESApp — ฐานข้อมูล Excel Server
- ESModel — Excel Server model database
- ESSystem — Excel Server system database

---

## 🔒 IIS Configuration

```
Site: ESWeb
ID: 2
Physical Path: C:\Program Files (x86)\Cesoft\Excel Server 2026\ESWeb
Binding: http://*:8080
```

---

## 📊 Key Directories

| Directory | Purpose |
|-----------|---------|
| `C:\Program Files (x86)\Cesoft\Excel Server 2026\ESWeb\` | Web application root |
| `C:\Program Files (x86)\Cesoft\Excel Server 2026\ESWeb\log\` | Application logs |
| `C:\Program Files (x86)\Cesoft\Excel Server 2026\ESWeb\UpFiles\` | Uploaded files |
| `C:\Program Files (x86)\Cesoft\Excel Server 2026\nginx\conf\` | Nginx configuration |
| `C:\Program Files (x86)\Cesoft\Excel Server 2026\dblog\` | Database logs |
| `C:\Program Files (x86)\Cesoft\Excel Server 2026\License\` | License files |

---

## 🔧 Management Commands

### Check service status
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.200" \
  "sc query ES_Server"
```

### Stop / Start service
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.200" \
  "net stop ES_Server && net start ES_Server"
```

### View ESWeb logs
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.200" \
  "dir \"C:\Program Files (x86)\Cesoft\Excel Server 2026\ESWeb\log\""
```

### Check IIS ESWeb site
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.200" \
  "cscript //nologo c:\Windows\System32\inetsrv\adsutil.vbs ENUM /w3svc/2"
```

---

## 📋 Health Check Items (Excel Server)

- [ ] ES_Server service: Running
- [ ] ES_nginx service: Running (port 5010)
- [ ] IIS ESWeb site (port 8080): Responding
- [ ] ESWeb accessible: `curl http://192.168.1.200:8080`
- [ ] AI services (ports 5001, 5002): Responding
- [ ] Disk space: C: > 200 GB free
- [ ] Database connection to SQL_SE: OK
- [ ] ESWeb logs: no recent errors

---

**Last Updated:** 2026-05-23  
**Next Review:** 2026-05-30
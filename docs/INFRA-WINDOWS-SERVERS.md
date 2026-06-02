# Infrastructure Documentation — MHX Group Windows Servers

**Version:** 1.0.0  
**Date:** 2026-05-23  
**Owner:** Elysia — Head of ICT  
**Scope:** 4 Windows Servers on 192.168.1.0/24

---

## 🖥️ Server Inventory

| Nickname | IP | Hostname | Role | RAM | OS |
|----------|-----|----------|------|-----|----|
| WIN-APP | 192.168.1.200 | WIN-APP | Application Server (ES_* services) | 16 GB | Win Srv 2022 DC |
| SQL_SE | 192.168.1.100 | SQL_SE | Main MSSQL + Primary Cluster | 128 GB | Win Srv 2022 DC |
| SQL_SE (cluster) | 192.168.1.34 | SQL_SE | Cluster Node 2 | 128 GB | Win Srv 2022 DC |
| SQL_SF | 192.168.1.35 | SQL_SF | Cluster Node 3 | 128 GB | Win Srv 2022 DC |

> ⚠️ 192.168.1.100 และ 192.168.1.34 มีชื่อ hostname เหมือนกัน (SQL_SE) แต่เป็นคนละ VM

---

## 🔐 Access Credentials

### SSH (Port 223)
```
User:     administrator
Password: bks214AA

Connection format:
  sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
    -o PreferredAuthentications=password -o PubkeyAuthentication=no \
    -p 223 "administrator@<IP>" "<command>"
```

### MSSQL
```
Server:   192.168.1.100\SXSQLSERVER (or 192.168.1.34, 192.168.1.35)
User:     sa
Password: 4533cdRR
Instance: SQL_SE\SXSQLSERVER
```

---

## 💾 Disk Layout

### WIN-APP (192.168.1.200)
| Drive | Size | Free | Notes |
|-------|------|------|-------|
| C: | 350 GB | 331 GB | OS, Program Files |
| D: | 500 GB | 495 GB | Data: Backup SQL\, File PA\ |
| E: | 5 GB | — | (empty) |
| F: | 735 MB | — | (small) |

### SQL_SE (192.168.1.100 / 192.168.1.34)
| Drive | Size | Free | Notes |
|-------|------|------|-------|
| C: | 300 GB | 234 GB | OS |
| D: | 1.2 TB | 841 GB | Data |
| L: | 500 GB | 406 GB | Large partition |
| T: | 100 GB | 100 GB | Temp/Logs |
| E:, F: | — | — | Empty |

### SQL_SF (192.168.1.35)
| Drive | Size | Free | Notes |
|-------|------|------|-------|
| C: | 300 GB | 261 GB | OS |
| D: | 1.2 TB | 904 GB | Data |
| L: | 500 GB | 499 GB | Large partition (mostly free) |
| T: | 100 GB | 100 GB | Temp/Logs |

---

## 🏃 Services Status

### WIN-APP — ES_* Services (All Running ✅)

| Service Name | Display Name | Status |
|--------------|-------------|--------|
| ES_AIMsgServer | ES_AIMsgServer | Running |
| ES_AIServer | ES_AIServer | Running |
| ES_Im_Server | ES_Im_Server | Running |
| ES_NFS_Service | ES_NFS_Server | Running |
| ES_nginx | ES_nginx | Running |
| ES_Server | ES_Server | Running |
| ES_ShareDoc_Server | ES_ShareDoc_Server | Running |
| ES_SMCServer | ES_SMCServer | Running |
| ES_Sync_Server | ES_Sync_Server | Running |

> ยังไม่พบ Excel Service ที่รันอยู่ — อาจเป็น service ที่ต้อง start ด้วยตัวเอง หรือใช้วิธีอื่น

---

## 🔧 Quick Commands Reference

### Check Server Info
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@<IP>" "systeminfo"
```

### Check Disk Space
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@<IP>" \
  "wmic logicaldisk get caption,freespace,size /format:csv"
```

### List Running Services
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@<IP>" "sc query state= all" | \
  grep -E "SERVICE_NAME|DISPLAY_NAME"
```

### Check MSSQL Backup Folder
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.100" "dir D:\SQLBackups\"
```

### MSSQL Query (list databases)
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@192.168.1.100" \
  "sqlcmd -S SQL_SE\\SXSQLSERVER -U sa -P 4533cdRR -Q \"SELECT name FROM sys.databases\" -y 0"
```

### Restart Service
```bash
sshpass -p 'bks214AA' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  -p 223 "administrator@<IP>" "net stop <ServiceName> && net start <ServiceName>"
```

---

## 📊 Excel Server / Excel Services

### ✅ Discovered: Excel Server 2022 / 2026

ใน `D:\File PA\2022V19.1.85 ENC\` พบ installer files:
- `en_ExcelServer2022.exe` — Excel Server 2022 (2022V19.1.85)
- `en_ExcelServer2022Client.exe` — Client
- `en_Excelserver2026.exe` — Excel Server 2026
- `excelserver2026.run` — Linux/Unix version?
- `key/` — license files สำหรับ Mahaxay Trading Co.,Ltd

**Installers ยังไม่ถูก run** — น่าจะต้องติดตั้งก่อนถึงจะใช้งานได้

### License Info (from D:\File PA\2022V19.1.85 ENC\key)
- `MAHAXAY TRADING CO.,LTD_2022_3_0u_19.1.23.txt`
- `Mahaxay Trading Co.,Ltd_2026_Package3_23.0.34.txt` — Excel Server 2026 Package 3

### Services ที่ควรมี (ถ้าติดตั้งแล้ว)
Excel Server มักรันเป็น Windows Service ชื่อ:
- `ExcelService` หรือ `EServer`
- ดูได้จาก: `sc query state= all | findstr /i "excel"`

### 🔧 Next Steps — Excel Server Setup
1. ติดตั้ง `en_ExcelServer2022.exe` บน WIN-APP (192.168.1.200)
2. Start service: `net start <ExcelServerServiceName>`
3. ตรวจสอบว่า client connection ทำงานได้
4. Update documentation หลังติดตั้งเสร็จ

---

**Next Update:** 2026-05-30  
**Note:** ยังต้องสำรวจ Excel Services เพิ่มเติม — Elysia จะ update หลังจากตรวจสอบเพิ่ม
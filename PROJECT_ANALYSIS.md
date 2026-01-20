
# ບົດວິເຄາະ ແລະ ແຜນພັດທະນາລະບົບ Mahaxay AI POS

ເອກະສານສະບັບນີ້ ສັງລວມຈຸດທີ່ຕ້ອງໄດ້ຮັບການແກ້ໄຂ ແລະ ພັດທະນາເພີ່ມເຕີມ ເພື່ອຍົກລະດັບໂປຣເຈັກຈາກ **Prototype (ຕົ້ນແບບ)** ໄປສູ່ **Production (ລະບົບທີ່ໃຊ້ງານຈິງ)**.

---

## 1. ບັນຫາທາງດ້ານສະຖາປັດຕະຍະກຳ (Architecture Conflict)
**ສະຖານະປະຈຸບັນ:** ໂຄງສ້າງມີຄວາມຂັດແຍ່ງກັນລະຫວ່າງ `Vite` ແລະ `Next.js`.
*   **ບັນຫາ:** ໂປຣເຈັກໃຊ້ `vite.config.ts` (Client-Side Rendering) ແຕ່ມີໂຟນເດີ `app/api` ທີ່ຂຽນແບບ `Next.js`. ໃນການເຮັດວຽກຕົວຈິງຂອງ Vite, ໂຄດໃນ `app/api` ຈະບໍ່ຖືກທຳງານ (Dead Code).
*   **ສິ່ງທີ່ຕ້ອງເຮັດ:**
    *   **ທາງເລືອກ A:** ຍ້າຍ Frontend ໄປໃຊ້ **Next.js** ເຕັມຮູບແບບ ເພື່ອໃຫ້ໃຊ້ API Routes ໄດ້.
    *   **ທາງເລືອກ B:** ຮັກສາ Vite ໄວ້ຄືເກົ່າ ແຕ່ສ້າງ **Backend Server** ແຍກຕ່າງຫາກ (Node.js/Express, NestJS, ຫຼື Elysia) ເພື່ອຈັດການ API ແລະ Database.

## 2. ລະບົບຖານຂໍ້ມູນ ແລະ ການບັນທຶກຂໍ້ມູນ (Database Persistence)
**ສະຖານະປະຈຸບັນ:** ໃຊ້ Mock Data ແລະ LocalStorage.
*   **ຄວາມສ່ຽງ:** ຖ້າຜູ້ໃຊ້ລຶບ Cache ຫຼື ປ່ຽນເຄື່ອງຄອມພິວເຕີ, ຂໍ້ມູນການຂາຍ ແລະ ສາງສິນຄ້າຈະຫາຍໄປທັນທີ.
*   **ສິ່ງທີ່ຂາດ:** ການເຊື່ອມຕໍ່ກັບຖານຂໍ້ມູນແທ້ (Real Database Connection).
*   **ສິ່ງທີ່ຕ້ອງເຮັດ:**
    *   ຕິດຕັ້ງ PostgreSQL ຫຼື MySQL.
    *   Run Prisma Migrations ເພື່ອສ້າງ Table ໃນຖານຂໍ້ມູນ.
    *   ເຊື່ອມຕໍ່ API ໃຫ້ຂຽນລົງ Database ແທນການຂຽນລົງຕົວປ່ຽນໃນ Memory.
    *   ເພີ່ມລະບົບ **Transactions** (`prisma.$transaction`) ເພື່ອປ້ອງກັນຂໍ້ມູນຜິດພາດ ເວລາຕັດສະຕັອກພ້ອມກັນຫຼາຍເຄື່ອງ.

## 3. ຄວາມປອດໄພ (Authentication & Security)
**ສະຖານະປະຈຸບັນ:** ການກວດສອບຢູ່ຝັ່ງ Client (Client-side Simulation).
*   **ຄວາມສ່ຽງ:** ລະຫັດຜ່ານຖືກກວດສອບໃນ Browser, ເຮັດໃຫ້ຜູ້ທີ່ມີຄວາມຮູ້ທາງເຕັກນິກສາມາດເຈາະຂໍ້ມູນໄດ້ງ່າຍ. API Key ຂອງ Gemini ຖືກເປີດເຜີຍ.
*   **ສິ່ງທີ່ຕ້ອງເຮັດ:**
    *   ຍ້າຍລະບົບ Login ໄປໄວ້ທີ່ Server.
    *   ໃຊ້ **JWT (JSON Web Tokens)** ຫຼື **Session** ໃນການຢືນຢັນຕົວຕົນ.
    *   ສ້າງ Middleware ເພື່ອກວດສອບສິດ (Role-based access) ໃນທຸກໆ API Endpoint.
    *   ຊ່ອນ API Key ໄວ້ໃນ Environment Variables ຝັ່ງ Server ເທົ່ານັ້ນ.

## 4. ການເຊື່ອມຕໍ່ອຸປະກອນ POS (Hardware Integration)
**ສະຖານະປະຈຸບັນ:** ໃຊ້ຄຳສັ່ງ Browser ພື້ນຖານ.
*   **ຈຸດອ່ອນ:** ການສັ່ງພິມໃບບິນໃຊ້ `window.print()` ເຊິ່ງຈະມີ Dialog ເດັ້ງຂຶ້ນມາຖາມທຸກຄັ້ງ (ຊັກຊ້າ). ການສະແກນບາໂຄດໃຊ້ກ້ອງ Webcam.
*   **ສິ່ງທີ່ຕ້ອງເຮັດ:**
    *   **Printing:** ພັດທະນາລະບົບເຊື່ອມຕໍ່ເຄື່ອງພິມຄວາມຮ້ອນຜ່ານ **WebUSB** ຫຼື **Web Bluetooth API** (ESC/POS commands) ເພື່ອພິມໃບບິນທັນທີໂດຍບໍ່ມີ Dialog.
    *   **Scanning:** ຮອງຮັບເຄື່ອງຍິງບາໂຄດ (Handheld Scanner) ໂດຍການດັກຈັບ Keyboard Events ທີ່ຈົບດ້ວຍປຸ່ມ Enter.

## 5. ລະບົບສາງສິນຄ້າຂັ້ນສູງ (Advanced Inventory)
**ສະຖານະປະຈຸບັນ:** ບັນທຶກຈຳນວນເຂົ້າ-ອອກ ທຳມະດາ.
*   **ສິ່ງທີ່ຂາດ:**
    *   **Costing Method:** ບໍ່ມີການຄິດໄລ່ຕົ້ນທຶນແບບ **FIFO** (First-In, First-Out) ຫຼື **Weighted Average Cost**. ເຮັດໃຫ້ການຄິດໄລ່ກຳໄລ/ຂາດທຶນ ບໍ່ຖືກຕ້ອງຕາມຫຼັກບັນຊີ.
    *   **Batch & Expiry:** ບໍ່ມີລະບົບຈັດການ ລັອດສິນຄ້າ (Lot/Batch) ແລະ ວັນໝົດອາຍຸ (ສຳຄັນສຳລັບສີ ຫຼື ເຄມີກໍ່ສ້າງ).
*   **ສິ່ງທີ່ຕ້ອງເຮັດ:** ເພີ່ມຕາຕະລາງ `StockLedger` ເພື່ອບັນທຶກທຸກການເຄື່ອນໄຫວ ແລະ ມູນຄ່າຂອງສິນຄ້າແຕ່ລະລັອດ.

## 6. ການເງິນ ແລະ ການປິດຍອດ (Financial Rigor)
**ສະຖານະປະຈຸບັນ:** ຄິດໄລ່ຍອດລວມແບບງ່າຍ.
*   **ສິ່ງທີ່ຂາດ:**
    *   **Blind Count:** ລະບົບປິດກະ (End Shift) ຄວນບັງຄັບໃຫ້ພະນັກງານນັບເງິນກ່ອນ ແລ້ວຈຶ່ງສະແດງຍອດໃນລະບົບ ເພື່ອກວດສອບເງິນເກີນ/ຂາດ (Short/Over).
    *   **Debt Aging:** ລະບົບຕິດຕາມໜີ້ສິນລູກຄ້າ ຍັງບໍ່ມີລາຍງານອາຍຸໜີ້ (Aging Report) ແລະ ປະຫວັດການຊຳລະແບບລະອຽດ.

---

## ຕາຕະລາງແຜນງານ (Development Roadmap)

| ຄວາມສຳຄັນ | ສ່ວນງານ (Area) | ສິ່ງທີ່ຕ້ອງເຮັດ (Action Item) |
| :--- | :--- | :--- |
| 🔴 **CRITICAL** | **Architecture** | ຕັດສິນໃຈເລືອກ Tech Stack (Next.js ຫຼື Separate Backend) ແລະ ຈັດໂຄງສ້າງຄືນໃໝ່. |
| 🔴 **CRITICAL** | **Security** | ຍ້າຍ Auth ແລະ API Keys ໄປໄວ້ Server-side. |
| 🟠 **HIGH** | **Database** | ເຊື່ອມຕໍ່ PostgreSQL ແລະ ແກ້ໄຂ API ໃຫ້ບັນທຶກຂໍ້ມູນແທ້. |
| 🟠 **HIGH** | **Performance** | ປັບປຸງການໂຫຼດຂໍ້ມູນສິນຄ້າ (Pagination) ສຳລັບຂໍ້ມູນຈຳນວນຫຼາຍ. |
| 🟡 **MEDIUM** | **Hardware** | ເຮັດລະບົບ Direct Print (ESC/POS) ສຳລັບເຄື່ອງພິມຄວາມຮ້ອນ. |
| 🟡 **MEDIUM** | **Inventory** | ພັດທະນາລະບົບຄິດໄລ່ຕົ້ນທຶນສະເລ່ຍ (Average Cost). |
| 🟢 **LOW** | **Features** | ເພີ່ມລະບົບນັບເງິນປິດກະ (Blind Count) ແລະ ຈັດການໜີ້ສິນ. |

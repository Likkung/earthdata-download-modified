# Earthdata Download Modified

เวอร์ชันแก้ไขจาก [NASA Earthdata Download](https://github.com/nasa/earthdata-download) โดยคงหน้าตาเดิมไว้

## เครดิตการพัฒนา

- **ต้นฉบับ:** NASA Earthdata Download และผู้ร่วมพัฒนาเดิม โดยเก็บประวัติและใบอนุญาต Apache-2.0 ไว้
- **แนวทางและการทดสอบใช้งานเวอร์ชันดัดแปลง:** Likkung เป็นผู้กำหนดความต้องการและทดลองใช้งาน
- **ผู้ช่วยพัฒนา:** OpenAI Codex ช่วยอ่านโค้ดต้นฉบับ เขียนส่วนแก้ไขและชุดทดสอบ จัดทำเอกสาร และเตรียม build Windows/Linux ตามแนวทางของ Likkung

รายชื่อทีมเดิมใน GitHub Contributors มาจากประวัติ commit ที่เก็บไว้ ไม่ได้หมายความว่าทีมเดิมเข้ามาร่วมพัฒนาเวอร์ชันดัดแปลงนี้ โครงการนี้ไม่ใช่ release ทางการของ NASA หรือ OpenAI

## สิ่งที่เพิ่ม

- Retry อัตโนมัติเมื่อเครือข่ายขัดข้องหรือดาวน์โหลดขึ้น Interrupted โดยลองต่อเรื่อย ๆ จนสำเร็จ หรือจนกด Pause/Cancel
- เว้นระยะ 5, 10, 20, 40 และสูงสุด 60 วินาทีระหว่าง retry
- Settings → File Extensions: กำหนดชนิดไฟล์สำหรับชุดดาวน์โหลดใหม่ เช่น `.h5, .nc, .tif` หรือ `.tar.gz`; เว้นว่างเพื่อโหลดทุกชนิด
- Settings → Automatic Retry: เปิด/ปิด retry อัตโนมัติ
- Pause และปิดโปรแกรมได้ เมื่อเปิดใหม่กด Resume เพื่อโหลดต่อจาก checkpoint
- ถ้าไฟล์บางส่วนหายหรือเซิร์ฟเวอร์ไม่สามารถโหลดต่อได้ โปรแกรมจะดาวน์โหลดไฟล์นั้นใหม่

## ใช้งานบน Windows

ตัวโปรแกรม ZIP แบบ portable อยู่ใน `release/1.0.9-modified.1/` ในเครื่องที่ build หากเผยแพร่บน GitHub ให้ดาวน์โหลดจาก Releases; ยังไม่มีไฟล์ติดตั้งที่สร้างเสร็จ

รุ่นนี้ยังเป็น preview: ชุดทดสอบที่เกี่ยวข้องผ่าน 50 ข้อ แต่ยังไม่ได้ยืนยันการโหลดต่อจาก byte เดิมด้วย Electron จริงหลังแก้ checkpoint รอบล่าสุด ดู [รายละเอียดการแก้ไขและข้อจำกัด](MODIFICATIONS.md)

เลือกนามสกุลใน Settings ก่อนส่งรายการดาวน์โหลดจาก Earthdata Search เข้ามา ตัวกรองใช้กับชุดใหม่ และไม่แปลงรูปแบบไฟล์ หากไม่พบชนิดไฟล์ที่เลือก จะไม่มีไฟล์ถูกดาวน์โหลดในชุดนั้น

ก่อนปิดเครื่อง ให้กด Pause แล้วปิดโปรแกรมตามปกติ เพื่อให้เขียน checkpoint และสำรองไฟล์บางส่วนครบ เมื่อเปิดกลับมา กด Resume ที่ชุดเดิม ไม่ต้องสร้างรายการใหม่

โปรแกรมอาจต้องลงชื่อเข้าใช้ Earthdata ใหม่หาก token หมดอายุ และยังต้องยอมรับ EULA สำหรับข้อมูลที่กำหนดเงื่อนไขนี้

ข้อมูลโปรแกรมเก็บแยกไว้ที่ `%APPDATA%/Earthdata Download Modified/` ส่วนไฟล์ `.edd-part` เป็นสำเนาของไฟล์ที่ยังโหลดไม่เสร็จ ต้องเก็บไว้จนกว่าจะโหลดครบ ไฟล์สำรองจะถูกลบเมื่อดาวน์โหลดสำเร็จ

เวอร์ชันนี้ปิดการอัปเดตอัตโนมัติจาก NASA เพื่อไม่ให้เวอร์ชันต้นฉบับเขียนทับส่วนแก้ไข

## สร้างและทดสอบจากโค้ด

ใช้ Node.js ตาม `.nvmrc` แล้วติดตั้ง dependency ด้วย `npm install --ignore-scripts` และ `node node_modules/electron/install.js` (`better-sqlite3` 13 มี native binary แบบ N-API มาแล้ว จึงไม่ต้อง rebuild)

```
npm start
npm run build
npm run dist:win
npm test -- --runInBand --coverage=false
node scripts/recovery-integration.cjs
```

ไฟล์ทดสอบ `modifiedDownloads.test.ts` และ `downloadPersistence.test.ts` ตรวจ retry, ตัวกรอง, checkpoint และการเปิดฐานข้อมูลกลับมาใหม่ ส่วน `scripts/recovery-integration.cjs` ทดสอบ Pause/ปิด/เปิด/Resume ด้วย Electron จริงกับ HTTP server ในเครื่องและเทียบไฟล์ทุก byte

ลิขสิทธิ์ต้นฉบับและใบอนุญาต Apache-2.0 อยู่ใน `LICENSE` เวอร์ชันนี้เป็นการปรับแต่งในเครื่อง ไม่ใช่ release ทางการของ NASA

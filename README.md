# 💬 Chaqchaq — O'rnatish yo'riqnomasi

## 📁 Fayllar
- `server.js` — Node.js backend (Telegram API bilan ishlaydi)
- `index.html` — Chaqchaq interfeysi
- `package.json` — NPM konfiguratsiya

---

## 🚀 1-qadam: Papka yarating

Kompyuteringizda yangi papka yarating, masalan:
```
C:\Users\Siz\Desktop\chaqchaq\
```

Ikkala faylni (`server.js` va `index.html`) shu papkaga joylashtiring.

---

## 🔑 2-qadam: API HASH ni yangilang

`server.js` faylini oching va bu qatorni toping:
```javascript
const API_HASH = 'YOUR_NEW_API_HASH';
```

[my.telegram.org/apps](https://my.telegram.org/apps) ga kiring va yangi `api_hash` olgan bo'lsangiz o'sha yerga qo'ying.

---

## 📦 3-qadam: GramJS o'rnatish

Terminal (CMD) da papkangizga o'ting:
```bash
cd C:\Users\Siz\Desktop\chaqchaq
npm install telegram
```

---

## ▶️ 4-qadam: Serverni ishga tushirish

```bash
node server.js
```

Mana bunday ko'rinadi:
```
🚀 Chaqchaq Server ishga tushmoqda...
✅ Server tayyor: http://localhost:3000
📱 Brauzerda oching!
```

---

## 🌐 5-qadam: Brauzerda ochish

Brauzeringizda oching:
```
http://localhost:3000
```

---

## 📱 Ishlatish

1. Telefon raqamingizni kiriting (`+998` avtomatik qo'shiladi)
2. Telegram sizga SMS kod yuboradi — o'sha kodni kiriting
3. Agar 2FA yoqilgan bo'lsa — parolni kiriting
4. **Haqiqiy kontaktlaringiz va chatlaringiz ko'rinadi!**

---

## ⚠️ Muhim

- `session.txt` fayli yaratiladi — bu sizning login ma'lumotlaringiz, uni hech kimga bermang
- Server ishlaganda `http://localhost:3000` da ishlaydi
- Har safar kompyuter o'chirilganda `node server.js` ni qayta ishga tushiring

---

## ❓ Muammolar

**`npm install telegram` ishlamasa:**
```bash
npm install telegram --legacy-peer-deps
```

**Port 3000 band bo'lsa:**
`server.js` da `const PORT = 3000;` ni `3001` ga o'zgartiring, keyin `http://localhost:3001` da oching.

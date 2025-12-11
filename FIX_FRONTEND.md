# حل مشكلة الواجهة الأمامية

## 🔍 المشكلة
الصفحة `http://localhost:5173/register` لا تعمل

## ✅ الحل خطوة بخطوة

### الخطوة 1: تأكد من تثبيت الحزم

افتح Terminal في مجلد المشروع وانتقل إلى مجلد frontend:

```bash
cd frontend
npm install
```

**انتظر حتى ينتهي التثبيت** (قد يستغرق دقيقة أو دقيقتين)

---

### الخطوة 2: شغّل الواجهة الأمامية

بعد تثبيت الحزم، شغّل الخادم:

```bash
npm run dev
```

**✅ يجب أن ترى:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### الخطوة 3: افتح المتصفح

اذهب إلى:
```
http://localhost:5173/register
```

---

## 🐛 إذا لم تعمل بعد

### أ) تحقق من الأخطاء في Terminal

انظر إلى Terminal الذي شغّلت فيه `npm run dev` - هل هناك أخطاء؟

**أخطاء شائعة:**

1. **"Cannot find module"**
   - الحل: شغّل `npm install` مرة أخرى

2. **"Port 5173 already in use"**
   - الحل: Vite سيستخدم منفذ آخر (5174، 5175...)
   - أو أوقف التطبيق الذي يستخدم المنفذ 5173

3. **"EADDRINUSE"**
   - الحل: غيّر المنفذ في `vite.config.js`:
   ```js
   server: {
     port: 5174, // بدلاً من 5173
   }
   ```

---

### ب) تحقق من Console المتصفح

1. افتح المتصفح
2. اضغط F12
3. اذهب إلى Console
4. ابحث عن أخطاء (باللون الأحمر)

**أخطاء شائعة:**

1. **"Failed to fetch"**
   - الباكند غير مشغّل
   - شغّل الباكند أولاً: `cd backend && npm run dev`

2. **"Cannot read property"**
   - خطأ في الكود
   - أرسل لي رسالة الخطأ

---

### ج) تحقق من أن الباكند يعمل

قبل فتح الواجهة، تأكد من أن الباكند يعمل:

```bash
# في terminal منفصل
cd backend
npm run dev
```

يجب أن ترى:
```
Server running on port 5000
```

---

## 📋 قائمة التحقق السريعة

- [ ] `cd frontend` - انتقلت إلى مجلد frontend
- [ ] `npm install` - ثبتت الحزم (انتظر حتى ينتهي)
- [ ] `npm run dev` - شغّلت الخادم
- [ ] رأيت رسالة "ready" في Terminal
- [ ] الباكند يعمل على المنفذ 5000
- [ ] فتحت `http://localhost:5173/register` في المتصفح

---

## 🆘 إذا استمرت المشكلة

1. **انسخ رسالة الخطأ** من Terminal أو Console المتصفح
2. **أرسلها لي** وسأساعدك في حلها

---

## ⚡ حل سريع (إعادة تثبيت)

إذا لم يعمل شيء، جرب إعادة التثبيت:

```bash
cd frontend
rm -rf node_modules  # على Linux/Mac
# أو
Remove-Item -Recurse -Force node_modules  # على Windows PowerShell

npm install
npm run dev
```

---

## ✅ النتيجة المتوقعة

بعد تشغيل `npm run dev`، يجب أن:
1. ترى رسالة "ready" في Terminal
2. تفتح المتصفح على `http://localhost:5173/register`
3. ترى صفحة التسجيل مع النموذج

---

**💡 نصيحة:** اترك Terminal مفتوحاً أثناء استخدام الواجهة!


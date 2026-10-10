# حل مشاكل فتح الصفحة

## 🔍 المشكلة: الصفحة لا تفتح

### الخطوة 1: التحقق من أن الخادم يعمل

افتح Terminal في مجلد `frontend` وتأكد من أن الخادم يعمل:

```bash
cd frontend
npm run dev
```

**يجب أن ترى:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

إذا لم ترى هذه الرسالة، فهذا يعني أن الخادم غير مشغّل.

---

### الخطوة 2: التحقق من الأخطاء في Terminal

انظر إلى Terminal الذي شغّلت فيه `npm run dev` - هل هناك أخطاء؟

**أخطاء شائعة:**

1. **"Cannot find module"**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **"Port 5173 already in use"**
   - Vite سيستخدم منفذ آخر (5174، 5175...)
   - أو أوقف التطبيق الذي يستخدم المنفذ 5173

3. **"EADDRINUSE"**
   - غيّر المنفذ في `vite.config.js`:
   ```js
   server: {
     port: 5174, // بدلاً من 5173
   }
   ```

---

### الخطوة 3: التحقق من Console المتصفح

1. افتح المتصفح
2. اضغط **F12** لفتح Developer Tools
3. اذهب إلى تبويب **Console**
4. ابحث عن أخطاء (باللون الأحمر)

**أخطاء شائعة:**

1. **"Failed to fetch"**
   - الباكند غير مشغّل (هذا طبيعي في Demo mode)
   - Demo mode لا يحتاج باكند

2. **"Cannot read property"**
   - خطأ في الكود
   - أرسل رسالة الخطأ

3. **"Module not found"**
   - الحزم غير مثبتة
   - شغّل `npm install`

---

### الخطوة 4: التحقق من الكود

تأكد من أن الملفات التالية موجودة وصحيحة:

- ✅ `frontend/src/main.jsx`
- ✅ `frontend/src/App.jsx`
- ✅ `frontend/src/contexts/AuthContext.jsx`
- ✅ `frontend/src/components/common/PrivateRoute.jsx`
- ✅ `frontend/src/pages/Dashboard.jsx`

---

### الخطوة 5: إعادة تشغيل الخادم

إذا استمرت المشكلة:

1. أوقف الخادم (اضغط Ctrl+C في Terminal)
2. احذف مجلد `node_modules` و `package-lock.json`:
   ```bash
   cd frontend
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   ```
3. أعد تثبيت الحزم:
   ```bash
   npm install
   ```
4. شغّل الخادم مرة أخرى:
   ```bash
   npm run dev
   ```

---

## ✅ الحل السريع

1. **تأكد من أنك في المجلد الصحيح:**
   ```bash
   cd frontend
   ```

2. **شغّل الخادم:**
   ```bash
   npm run dev
   ```

3. **افتح المتصفح:**
   ```
   http://localhost:5173
   ```

---

## 🆘 إذا استمرت المشكلة

1. **انسخ رسالة الخطأ** من Terminal أو Console المتصفح
2. **تحقق من:**
   - هل الخادم يعمل؟
   - هل هناك أخطاء في Console؟
   - هل الحزم مثبتة بشكل صحيح؟

---

## 📝 ملاحظات

- **Demo mode لا يحتاج باكند**: يمكنك استخدام التطبيق بدون تشغيل الباكند
- **المنفذ الافتراضي**: 5173
- **إذا كان المنفذ مستخدماً**: Vite سيستخدم منفذ آخر تلقائياً



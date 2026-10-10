# خطوات اختبار المرحلة الأولى - بالعربية

## 🎯 الهدف
اختبار نظام المصادقة والتسجيل والدخول بشكل كامل.

---

## 📦 الخطوة 1: إعداد قاعدة البيانات

### أ) افتح PostgreSQL
- افتح **pgAdmin** أو **psql**

### ب) أنشئ قاعدة البيانات
```sql
CREATE DATABASE budgetmate;
```

### ج) احفظ معلومات الاتصال
- Host: `localhost`
- Port: `5432`
- Database: `budgetmate`
- Username: `postgres` (أو اسمك)
- Password: (كلمة مرور PostgreSQL)

---

## ⚙️ الخطوة 2: إعداد الباكند

### أ) افتح Terminal في مجلد المشروع

### ب) انتقل إلى مجلد الباكند
```bash
cd backend
```

### ج) ثبت الحزم
```bash
npm install
```

### د) أنشئ ملف `.env`
```bash
# على Windows PowerShell
Copy-Item env.example .env

# أو انسخ محتوى env.example وأنشئ ملف .env يدوياً
```

### هـ) عدّل ملف `.env`
افتح ملف `backend/.env` وعدّل القيم:

```env
DATABASE_URL="postgresql://postgres:كلمة_المرور@localhost:5432/budgetmate"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-12345"
JWT_REFRESH_SECRET="your-refresh-token-secret-67890"
JWT_EXPIRE="24h"
JWT_REFRESH_EXPIRE="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

**⚠️ مهم:** استبدل `كلمة_المرور` بكلمة مرور PostgreSQL!

### و) أنشئ جداول قاعدة البيانات
```bash
npm run prisma:generate
npm run prisma:migrate
```

عند السؤال عن اسم الـ migration، اكتب: `init`

### ز) أضف البيانات الأولية
```bash
npm run prisma:seed
```

### ح) شغّل الباكند
```bash
npm run dev
```

**✅ يجب أن ترى:**
```
Server running on port 5000
```

**⚠️ اترك هذا Terminal مفتوحاً!**

---

## 🎨 الخطوة 3: إعداد الواجهة الأمامية

### أ) افتح Terminal جديد

### ب) انتقل إلى مجلد الواجهة
```bash
cd frontend
```

### ج) ثبت الحزم
```bash
npm install
```

### د) شغّل الواجهة
```bash
npm run dev
```

**✅ يجب أن ترى:**
```
  VITE v4.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

**⚠️ اترك هذا Terminal مفتوحاً أيضاً!**

---

## 🧪 الخطوة 4: الاختبارات

### الاختبار 1: التحقق من الباكند

1. افتح المتصفح
2. اذهب إلى: `http://localhost:5000/api/health`

**✅ النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "message": "Budget Mate API is running"
  }
}
```

---

### الاختبار 2: اختبار API تلقائياً (سكربت)

في Terminal جديد (الباكند يجب أن يعمل):

```bash
cd backend
npm run test:api
```

**✅ يجب أن ترى نتائج الاختبارات**

---

### الاختبار 3: التسجيل من الواجهة

1. افتح: `http://localhost:5173/register`
2. املأ النموذج:
   - **الاسم**: أحمد محمد
   - **البريد**: ahmed@test.com
   - **كلمة المرور**: password123
   - **تأكيد كلمة المرور**: password123
3. اضغط "إنشاء حساب"

**✅ النتيجة:**
- يتم توجيهك إلى Dashboard
- ترى رسالة ترحيب

---

### الاختبار 4: تسجيل الدخول

1. اضغط Logout (أو اذهب إلى `/login`)
2. أدخل:
   - **البريد**: ahmed@test.com
   - **كلمة المرور**: password123
3. اضغط "تسجيل الدخول"

**✅ النتيجة:**
- يتم توجيهك إلى Dashboard

---

### الاختبار 5: اختبار المسارات المحمية

1. سجّل الدخول
2. اضغط F12 (Developer Tools)
3. اذهب إلى Console
4. نفّذ:
```javascript
localStorage.removeItem('token')
localStorage.removeItem('user')
location.reload()
```

5. حاول الوصول إلى Dashboard

**✅ النتيجة:**
- يتم توجيهك إلى صفحة Login
- لا يمكنك الوصول بدون تسجيل الدخول

---

### الاختبار 6: اختبار API يدوياً (Postman/Thunder Client)

#### أ) التسجيل:

**POST** `http://localhost:5000/api/auth/register`

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "name": "محمد علي",
  "email": "mohammed@test.com",
  "password": "password123"
}
```

**✅ النتيجة:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

#### ب) المسار المحمي:

**GET** `http://localhost:5000/api/auth/me`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**✅ النتيجة:**
معلومات المستخدم

**❌ بدون Token:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "No token provided"
  }
}
```

---

## ✅ قائمة التحقق

- [ ] PostgreSQL يعمل
- [ ] قاعدة البيانات `budgetmate` موجودة
- [ ] ملف `.env` مكتمل
- [ ] الباكند يعمل (Terminal 1)
- [ ] الواجهة تعمل (Terminal 2)
- [ ] Health check يعمل
- [ ] التسجيل يعمل
- [ ] تسجيل الدخول يعمل
- [ ] المسارات المحمية تعمل
- [ ] لا توجد أخطاء في Console

---

## 🐛 حل المشاكل

### الباكند لا يعمل:
- تحقق من ملف `.env`
- تحقق من أن PostgreSQL يعمل
- تحقق من أن المنفذ 5000 غير مستخدم

### الواجهة لا تعمل:
- تحقق من أن `npm install` تم بنجاح
- تحقق من أن المنفذ 5173 غير مستخدم

### خطأ في قاعدة البيانات:
- تحقق من `DATABASE_URL` في `.env`
- تأكد من أن قاعدة البيانات موجودة
- تأكد من كلمة المرور

### خطأ CORS:
- تحقق من `FRONTEND_URL` في `.env`
- تأكد من أن الباكند يعمل

---

## 🎉 النجاح!

إذا نجحت جميع الاختبارات، **المرحلة الأولى مكتملة!** ✅

يمكنك الآن الانتقال إلى المرحلة الثانية (الميزات الأساسية).


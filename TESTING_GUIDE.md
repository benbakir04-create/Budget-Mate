# دليل اختبار المرحلة الأولى - Budget Mate

## 📋 متطلبات ما قبل الاختبار

### 1. التأكد من تثبيت المتطلبات:

- ✅ Node.js 18+
- ✅ PostgreSQL مثبت ويعمل
- ✅ npm أو yarn

### 2. التحقق من تثبيت Node.js:

```bash
node --version
# يجب أن يكون v18 أو أعلى
```

### 3. التحقق من PostgreSQL:

```bash
# على Windows (PowerShell)
psql --version

# أو افتح pgAdmin للتحقق من أن PostgreSQL يعمل
```

---

## 🔧 خطوات الإعداد

### الخطوة 1: إعداد قاعدة البيانات PostgreSQL

1. افتح PostgreSQL (pgAdmin أو psql)
2. أنشئ قاعدة بيانات جديدة:

```sql
CREATE DATABASE budgetmate;
```

3. احفظ معلومات الاتصال:
   - Host: localhost
   - Port: 5432 (الافتراضي)
   - Database: budgetmate
   - Username: postgres (أو اسم المستخدم الخاص بك)
   - Password: (كلمة مرور PostgreSQL)

---

### الخطوة 2: إعداد الباكند

1. انتقل إلى مجلد الباكند:

```bash
cd backend
```

2. ثبت الحزم:

```bash
npm install
```

3. أنشئ ملف `.env`:

```bash
# على Windows PowerShell
Copy-Item env.example .env

# أو على Linux/Mac
cp env.example .env
```

4. افتح ملف `.env` وعدّل القيم:

```env
# Database - استبدل بالقيم الصحيحة
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/budgetmate"

# JWT - استخدم مفاتيح قوية (يمكنك توليدها عشوائياً)
JWT_SECRET="your-super-secret-jwt-key-change-in-production-12345"
JWT_REFRESH_SECRET="your-refresh-token-secret-67890"
JWT_EXPIRE="24h"
JWT_REFRESH_EXPIRE="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"
```

5. أنشئ جداول قاعدة البيانات:

```bash
npm run prisma:generate
npm run prisma:migrate
```

6. أضف البيانات الأولية (الفئات الافتراضية):

```bash
npm run prisma:seed
```

7. شغّل الباكند:

```bash
npm run dev
```

**✅ يجب أن ترى:**

```
Server running on port 5000
```

---

### الخطوة 3: إعداد الواجهة الأمامية

1. افتح نافذة terminal جديدة وانتقل إلى مجلد الواجهة:

```bash
cd frontend
```

2. ثبت الحزم:

```bash
npm install
```

3. (اختياري) أنشئ ملف `.env` إذا أردت تغيير الإعدادات:

```bash
# على Windows PowerShell
Copy-Item .env.example .env
```

4. شغّل الواجهة الأمامية:

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

## 🧪 اختبار النظام

### الاختبار 1: التحقق من صحة الباكند

1. افتح المتصفح واذهب إلى:

```
http://localhost:5000/api/health
```

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

### الاختبار 2: تسجيل مستخدم جديد

1. افتح المتصفح واذهب إلى:

```
http://localhost:5173/register
```

2. املأ النموذج:
   - **الاسم**: أحمد محمد
   - **البريد الإلكتروني**: ahmed@test.com
   - **كلمة المرور**: password123 (8 أحرف على الأقل)
   - **تأكيد كلمة المرور**: password123

3. اضغط "إنشاء حساب"

**✅ النتيجة المتوقعة:**

- يتم توجيهك تلقائياً إلى صفحة Dashboard
- ترى رسالة ترحيب باسمك

**❌ إذا ظهر خطأ:**

- تحقق من أن الباكند يعمل على المنفذ 5000
- تحقق من console المتصفح (F12) للأخطاء
- تحقق من terminal الباكند للأخطاء

---

### الاختبار 3: تسجيل الدخول

1. اضغط على Logout (إذا كنت مسجلاً)
2. اذهب إلى:

```
http://localhost:5173/login
```

3. أدخل:
   - **البريد الإلكتروني**: ahmed@test.com
   - **كلمة المرور**: password123

4. اضغط "تسجيل الدخول"

**✅ النتيجة المتوقعة:**

- يتم توجيهك إلى Dashboard
- ترى اسمك في الصفحة

---

### الاختبار 4: اختبار المسارات المحمية

1. سجّل الدخول أولاً
2. افتح Developer Tools (F12)
3. اذهب إلى Console
4. نفّذ هذا الأمر:

```javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
```

5. حاول الوصول إلى:

```
http://localhost:5173/dashboard
```

**✅ النتيجة المتوقعة:**

- يتم توجيهك تلقائياً إلى صفحة Login
- لا يمكنك الوصول إلى Dashboard بدون تسجيل الدخول

---

### الاختبار 5: اختبار API مباشرة (Postman/Thunder Client)

#### أ) اختبار التسجيل:

**POST** `http://localhost:5000/api/auth/register`

Headers:

```
Content-Type: application/json
```

Body (JSON):

```json
{
  "name": "محمد علي",
  "email": "mohammed@test.com",
  "password": "password123"
}
```

**✅ النتيجة المتوقعة:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "محمد علي",
      "email": "mohammed@test.com",
      "currency": "SAR",
      "language": "ar"
    }
  }
}
```

#### ب) اختبار الدخول:

**POST** `http://localhost:5000/api/auth/login`

Body (JSON):

```json
{
  "email": "mohammed@test.com",
  "password": "password123"
}
```

**✅ النتيجة المتوقعة:**
نفس شكل استجابة التسجيل

#### ج) اختبار المسار المحمي:

**GET** `http://localhost:5000/api/auth/me`

Headers:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**✅ النتيجة المتوقعة:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "mohammed@test.com",
      "name": "محمد علي",
      "currency": "SAR",
      "language": "ar",
      "createdAt": "..."
    }
  }
}
```

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

### الاختبار 6: اختبار التحقق من صحة البيانات

#### أ) محاولة التسجيل ببريد موجود:

**POST** `http://localhost:5000/api/auth/register`

Body:

```json
{
  "name": "Test",
  "email": "mohammed@test.com",
  "password": "password123"
}
```

**✅ النتيجة المتوقعة:**

```json
{
  "success": false,
  "error": {
    "code": "USER_EXISTS",
    "message": "User already exists"
  }
}
```

#### ب) محاولة التسجيل بكلمة مرور قصيرة:

**POST** `http://localhost:5000/api/auth/register`

Body:

```json
{
  "name": "Test",
  "email": "test2@test.com",
  "password": "123"
}
```

**✅ النتيجة المتوقعة:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

---

## 🔍 فحص الأخطاء الشائعة

### خطأ: "Cannot connect to database"

**الحل:**

1. تأكد من أن PostgreSQL يعمل
2. تحقق من `DATABASE_URL` في ملف `.env`
3. تأكد من أن قاعدة البيانات `budgetmate` موجودة

---

### خطأ: "Port 5000 already in use"

**الحل:**

1. غيّر PORT في ملف `.env` إلى 5001
2. أو أوقف التطبيق الذي يستخدم المنفذ 5000

---

### خطأ: "Port 5173 already in use"

**الحل:**

1. Vite سيستخدم منفذ آخر تلقائياً (5174، 5175...)
2. أو أوقف التطبيق الذي يستخدم المنفذ 5173

---

### خطأ: "Missing required environment variables"

**الحل:**

1. تأكد من وجود ملف `.env` في مجلد `backend`
2. تأكد من أن جميع المتغيرات موجودة في `.env`
3. أعد تشغيل الباكند

---

### خطأ: "Prisma Client not generated"

**الحل:**

```bash
cd backend
npm run prisma:generate
```

---

### خطأ في الواجهة: "Network Error" أو "CORS Error"

**الحل:**

1. تأكد من أن الباكند يعمل
2. تحقق من `FRONTEND_URL` في `.env` الخاص بالباكند
3. تأكد من أن `VITE_API_URL` في الواجهة صحيح

---

## ✅ قائمة التحقق النهائية

- [ ] PostgreSQL يعمل وقاعدة البيانات `budgetmate` موجودة
- [ ] ملف `.env` في الباكند مكتمل وصحيح
- [ ] الباكند يعمل على المنفذ 5000
- [ ] الواجهة الأمامية تعمل على المنفذ 5173
- [ ] يمكن التسجيل بحساب جديد
- [ ] يمكن تسجيل الدخول
- [ ] المسارات المحمية تعمل (لا يمكن الوصول بدون token)
- [ ] التحقق من صحة البيانات يعمل
- [ ] لا توجد أخطاء في console المتصفح
- [ ] لا توجد أخطاء في terminal الباكند

---

## 📞 إذا واجهت مشاكل

1. تحقق من console المتصفح (F12 → Console)
2. تحقق من terminal الباكند للأخطاء
3. تحقق من terminal الواجهة الأمامية للأخطاء
4. تأكد من أن جميع الخطوات تمت بشكل صحيح

---

**🎉 إذا نجحت جميع الاختبارات، المرحلة الأولى مكتملة بنجاح!**

# دليل البدء السريع - Budget Mate

## ⚡ البدء السريع (5 دقائق)

### 1️⃣ إعداد قاعدة البيانات

```sql
-- افتح PostgreSQL واشغل هذا الأمر
CREATE DATABASE budgetmate;
```

### 2️⃣ إعداد الباكند

```bash
cd backend
npm install
Copy-Item env.example .env
# عدّل ملف .env بالقيم الصحيحة
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 3️⃣ إعداد الواجهة الأمامية

```bash
# في terminal جديد
cd frontend
npm install
npm run dev
```

### 4️⃣ افتح المتصفح

```
http://localhost:5173
```

---

## 📝 ملف .env للباكند

أنشئ ملف `backend/.env` بهذا المحتوى:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/budgetmate"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-12345"
JWT_REFRESH_SECRET="your-refresh-token-secret-67890"
JWT_EXPIRE="24h"
JWT_REFRESH_EXPIRE="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

**⚠️ مهم:** استبدل `YOUR_PASSWORD` بكلمة مرور PostgreSQL الخاصة بك!

---

## ✅ اختبار سريع

1. افتح: `http://localhost:5173/register`
2. سجّل حساب جديد
3. يجب أن يتم توجيهك إلى Dashboard

**🎉 إذا نجح، كل شيء يعمل!**

---

## 🐛 مشاكل شائعة

**خطأ في الاتصال بقاعدة البيانات:**
- تأكد من أن PostgreSQL يعمل
- تحقق من كلمة المرور في `DATABASE_URL`

**الباكند لا يعمل:**
- تحقق من أن المنفذ 5000 غير مستخدم
- تأكد من وجود ملف `.env`

**الواجهة لا تتصل بالباكند:**
- تأكد من أن الباكند يعمل
- تحقق من console المتصفح (F12)


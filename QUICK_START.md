# 🚀 دليل البدء السريع - Budget Mate

## ⚡ الإعداد في دقيقتين

### الخطوة 1: تشغيل السكريبت التلقائي

**على Windows:**

```cmd
setup.bat
REM أو استخدم الأوامر البسيطة:
make setup
```

**على Linux/Mac:**

```bash
chmod +x setup.sh
./setup.sh
# أو استخدم make:
make setup
```

**استخدام Docker (الأسهل):**

```bash
docker-compose up --build
```

### الخطوة 2: اختيار وضع التشغيل

#### 🎯 للتجربة السريعة (Demo Mode):

```bash
# في مجلد frontend، أنشئ ملف .env
echo "VITE_DEMO_MODE=true" > .env

# شغّل التطبيق
run.bat    # على Windows
./run.sh   # على Linux/Mac
```

#### 🛠️ للتطوير الكامل (مع قاعدة بيانات):

1. **تثبيت PostgreSQL:**
   - Windows: حمل من https://www.postgresql.org/download/windows/
   - Linux: `sudo apt install postgresql postgresql-contrib`
   - Mac: `brew install postgresql`

2. **إنشاء قاعدة البيانات:**

   ```sql
   CREATE DATABASE budgetmate;
   ```

3. **تحديث إعدادات قاعدة البيانات:**
   - افتح `backend/.env`
   - غيّر `DATABASE_URL` ببياناتك

4. **تشغيل قاعدة البيانات:**

   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **تشغيل التطبيق:**

   ```bash
   run-backend.bat  # على Windows
   ./run-backend.sh # على Linux/Mac

   run.bat          # على Windows
   ./run.sh         # على Linux/Mac
   ```

#### 🐳 للإعداد المتقدم (Docker):

```bash
# تأكد من تثبيت Docker و Docker Compose
docker --version
docker-compose --version

# شغّل التطبيق
docker-compose up --build
```

## 🌐 فتح التطبيق

بعد التشغيل، افتح المتصفح واذهب إلى:

- **http://localhost:5173** - الواجهة الأمامية

## 📝 أول استخدام

### في وضع Demo:

- ستجد حساباً تجريبياً جاهزاً
- يمكنك تصفح الميزات دون تسجيل

### في الوضع الكامل:

1. اضغط "إنشاء حساب"
2. املأ البيانات:
   - الاسم: أحمد محمد
   - البريد: ahmed@test.com
   - كلمة المرور: password123
3. اضغط "إنشاء حساب"

## 🔧 استكشاف الأخطاء

### خطأ "Port already in use":

```bash
# على Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# على Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### خطأ في قاعدة البيانات:

```bash
cd backend
npm run prisma:studio  # لمراجعة البيانات
```

### خطأ في التثبيت:

```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

## 🛠️ أوامر التطوير السريعة

### استخدام Make (موصى به)

```bash
# إعداد المشروع لأول مرة
make setup

# تشغيل وضع demo
make run-demo

# تشغيل التطبيق الكامل
make run

# تشغيل الباك إند فقط
make run-backend

# تنظيف المشروع
make clean

# عرض جميع الأوامر
make help
```

### أوامر قاعدة البيانات

```bash
# تطبيق تغييرات قاعدة البيانات
make db-migrate

# إضافة البيانات الأولية
make db-seed

# فتح واجهة إدارة البيانات
make db-studio
```

## 📞 تحتاج مساعدة؟

- راجع `DEVELOPMENT.md` للتطوير المفصل
- راجع `TESTING_GUIDE.md` لاختبار مفصل
- راجع `TROUBLESHOOTING.md` لحل المشاكل
- راجع `FIX_FRONTEND.md` و `FIX_REGISTRATION.md` للمشاكل المعروفة

---

**💡 نصيحة:** ابدأ بوضع Demo للتعرف على التطبيق، ثم انتقل للوضع الكامل للتطوير!
